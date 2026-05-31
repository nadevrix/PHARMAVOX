"""
Endpoint del Asistente FarmaVox — POST /api/v1/ask
===================================================
Conecta el asistente de voz de Alejandro con la API REST de PharmaVox.

Optimizaciones S-2:
  - Base de conocimiento limitada estrictamente a prospectos PDF cargados en BD (RAG estricto).
  - Generación de audio TTS en el backend (edge-tts) guardado en un archivo único temporal.
  - Retorno directo del audio MP3 en formato Base64 en la misma respuesta JSON (AskResponse).
  - Eliminación completa de historial conversacional.
"""

import os
import logging
import base64
import edge_tts
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.db.session import get_db
from app.models.medication import Medication
from app.schemas.assistant import AskRequest, AskResponse, VisualLayout
from app.services import gemini_service

logger = logging.getLogger(__name__)
router = APIRouter()

AUDIO_PATH = Path("data/voice_response.mp3")

async def generate_voice_response(text: str) -> str:
    """
    Genera dinámicamente un archivo de audio MP3 con la voz neural de Microsoft,
    lo almacena temporalmente y retorna el archivo codificado en Base64.
    """
    try:
        AUDIO_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # Limpia caracteres extraños antes de mandar al TTS
        clean_text = text.replace("*", "").replace("-", "").replace("#", "").strip()
        communicate = edge_tts.Communicate(
            text=clean_text,
            voice="es-MX-DaliaNeural",
            rate="+5%"
        )
        await communicate.save(str(AUDIO_PATH))
        
        # Convertir a Base64
        if AUDIO_PATH.exists():
            with open(AUDIO_PATH, "rb") as audio_file:
                encoded_string = base64.b64encode(audio_file.read()).decode("utf-8")
                return encoded_string
        return ""
    except Exception as e:
        logger.error(f"Error al generar audio TTS en backend: {e}", exc_info=True)
        return ""

@router.post("/ask", response_model=AskResponse)
async def ask_assistant(
    request: AskRequest,
    db: Session = Depends(get_db)
):
    """
    Realiza una consulta conversacional al asistente FarmaVox.
    El conocimiento de la IA está limitado estrictamente a los prospectos PDF cargados en la BD.
    Retorna la respuesta escrita, visual y el audio TTS codificado en Base64 en una sola llamada.
    """
    try:
        # 1. Obtener prospectos y medicamentos indexados en la base de datos
        medications = db.query(Medication).all()

        # Si no hay medicamentos en la base de datos, retornar mensaje especial
        if not medications:
            empty_msg = (
                "Hola. Actualmente no hay prospectos de medicamentos cargados en la base de datos "
                "de PharmaVox. Por favor, sube un prospecto oficial en formato PDF para poder ayudarte."
            )
            # Generar audio y codificar a Base64
            audio_base64 = await generate_voice_response(empty_msg)

            layout = VisualLayout(
                display_mode="card",
                card_type="warning",
                title="Base de Conocimiento Vacía",
                content_bullets=[
                    "No hay prospectos de medicamentos cargados en la BD.",
                    "Sube un archivo PDF mediante el endpoint POST /admin/pdfs."
                ],
                highlight_color="#F59E0B"
            )

            return AskResponse(
                text_response=empty_msg,
                voice_response=empty_msg,
                visual_layout=layout,
                audio_chunks=["/api/v1/assistant/audio"],
                audio_base64=audio_base64
            )

        # 2. Construir el contexto unificado basado exclusivamente en la base de datos
        context_meds = []
        for med in medications:
            med_info = (
                f"Medicamento: {med.name}\n"
                f"Principio Activo: {med.active_ingredient}\n"
                f"Concentración: {med.concentration}\n"
                f"Presentación: {med.presentation}\n"
                f"Laboratorio: {med.manufacturer}\n"
                f"Información Técnica del Prospecto:\n{med.raw_leaflet_text}"
            )
            context_meds.append(med_info)
        
        db_knowledge_context = "\n\n---\n\n".join(context_meds)

        # 3. Consultar al servicio de Gemini (RAG estricto)
        answer = gemini_service.ask_assistant(
            question=request.question,
            medication_context=db_knowledge_context,
        )

        # 4. Generar audio TTS y codificar a Base64
        audio_base64 = await generate_voice_response(answer)

        layout = _build_visual_layout(answer, request.question)

        return AskResponse(
            text_response=answer,
            voice_response=answer,
            visual_layout=layout,
            audio_chunks=["/api/v1/assistant/audio"],
            audio_base64=audio_base64,
        )

    except Exception as e:
        logger.error(f"Error en ask_assistant: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar el asistente FarmaVox: {str(e)}"
        )

@router.get("/assistant/audio")
async def get_audio():
    """
    Devuelve en tiempo real el archivo MP3 temporal con la última respuesta de voz generada.
    """
    if not AUDIO_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="No se ha generado ningún audio de respuesta conversacional todavía."
        )
    return FileResponse(
        path=str(AUDIO_PATH),
        media_type="audio/mpeg",
        filename="voice_response.mp3"
    )

def _build_visual_layout(answer: str, question: str) -> VisualLayout:
    """
    Genera sugerencias de layout visual basadas en el contenido de la respuesta.
    """
    answer_lower = answer.lower()
    question_lower = question.lower()

    warning_keywords = [
        "contraindicado", "no debe", "no tomar", "peligro", "riesgo",
        "alergia", "reacción adversa", "interacción", "supervisión",
        "evitar", "precaución", "advertencia"
    ]
    is_warning = any(kw in answer_lower for kw in warning_keywords)

    dose_keywords = ["dosis", "cuánto", "cuantas", "cada cuánto", "horario", "tomar"]
    is_dose = any(kw in question_lower for kw in dose_keywords)

    if is_warning:
        card_type = "warning"
        highlight_color = "#E11D48"
        title = "Información de Seguridad"
    elif is_dose:
        card_type = "info"
        highlight_color = "#0EA5E9"
        title = "Pauta de Dosificación"
    else:
        card_type = "info"
        highlight_color = "#3B82F6"
        title = "Información Farmacéutica"

    sentences = [s.strip() for s in answer.split(".") if s.strip()]
    bullets = sentences[:3] if len(sentences) > 1 else [answer]

    return VisualLayout(
        display_mode="card",
        card_type=card_type,
        title=title,
        content_bullets=bullets,
        highlight_color=highlight_color,
    )
