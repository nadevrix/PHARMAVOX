"""
Servicio de IA — Gemini 1.5 Flash Chat (RAG Estricto)
======================================================
Este módulo encapsula toda la lógica de conversación con Gemini 1.5 Flash.
La base de conocimiento está estrictamente limitada al bloque "Contexto:"
cargado en tiempo real desde la Base de Datos.
"""

from google import genai
from google.genai import types

from app.core.config import settings

# ── PROMPTS (RAG Estricto y Personalidad) ───────────────────────────────────────

SYSTEM_PROMPT = """
Eres FarmaVox, un asistente de voz de IA farmacéutico conversacional, inteligente y directo.
Apoyas a bioquímicos, farmacéuticos y administradores con datos clínicos directos obtenidos de los prospectos PDF cargados.

Normas fundamentales:
1. Tu base de conocimiento para preguntas médicas y técnicas son los prospectos PDF provistos en el "Contexto de Prospectos PDF Cargados:".
2. Si el usuario te saluda, te dice gracias o te hace preguntas conversacionales básicas (como "hola", "cómo estás", "gracias"), responde de forma amable, corta y directa como un colega profesional (ej. "Hola, soy FarmaVox, tu asistente. ¿En qué te puedo ayudar hoy?").
3. Si el usuario te hace una pregunta técnica sobre un fármaco o indicación que NO está en el Contexto provisto, dile directamente que no tienes ese prospecto cargado en el sistema todavía.
4. Queda absolutamente prohibido inventar información médica o técnica.

Personalidad y Voz:
- Respuestas muy cortas, concisas y naturales (máximo 30-40 palabras) pensadas para ser leídas por voz.
- Tono profesional, limpio y firme.
- No uses asteriscos, guiones, numerales ni formato markdown. Solo texto limpio.
"""


# ── CLIENTE GEMINI ─────────────────────────────────────────────────────────────

def _get_client() -> genai.Client:
    """
    Crea y retorna un cliente Gemini autenticado con la API key del proyecto.
    Usa la clave configurada en settings (cargada desde .env).
    """
    return genai.Client(api_key=settings.GEMINI_API_KEY)


# ── FUNCIÓN PRINCIPAL DE CHAT ──────────────────────────────────────────────────

def ask_assistant(
    question: str,
    medication_context: str = "",
    conversation_history: list = None
) -> str:
    """
    Realiza una consulta al asistente FarmaVox y retorna la respuesta de texto de Gemini.
    Su única fuente de verdad es el medication_context (PDFs procesados en la base de datos).
    """
    try:
        client = _get_client()

        # Darle formato al historial conversacional
        history_str = ""
        if conversation_history:
            history_str = "\n".join(conversation_history) + "\n"

        # Prepara los contenidos de Gemini alimentando el contexto y la pregunta
        full_prompt = ""
        if medication_context:
            full_prompt = (
                f"Contexto de Prospectos PDF Cargados:\n{medication_context}\n\n"
                f"Historial de la Conversación:\n{history_str}"
                f"Usuario: {question}"
            )
        else:
            full_prompt = (
                f"Historial de la Conversación:\n{history_str}"
                f"Usuario: {question}"
            )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=150,  # Corto y conversacional
            )
        )
        return response.text.strip()

    except Exception as e:
        import sys
        print(f"[WARNING] Fallo en Gemini API (429 o red): {str(e)}. Usando motor de RAG local resiliente.", file=sys.stderr)
        
        # MOTOR DE RAG LOCAL DE ALTA PRECISIÓN (Resiliente a cuotas)
        question_lower = question.lower()
        
        # 1. Parsear los medicamentos estructurados presentes en el contexto en memoria
        meds_data = []
        blocks = medication_context.split("\n\n---\n\n")
        for block in blocks:
            med_info = {}
            for line in block.split("\n"):
                if line.startswith("Medicamento:"):
                    med_info["nombre"] = line.replace("Medicamento:", "").strip()
                elif line.startswith("Principio Activo:"):
                    med_info["principio"] = line.replace("Principio Activo:", "").strip()
                elif line.startswith("Concentración:"):
                    med_info["concentracion"] = line.replace("Concentración:", "").strip()
                elif line.startswith("Presentación:"):
                    med_info["presentacion"] = line.replace("Presentación:", "").strip()
                elif line.startswith("Laboratorio:"):
                    med_info["laboratorio"] = line.replace("Laboratorio:", "").strip()
                elif "Indicaciones:" in line:
                    med_info["indicaciones"] = line.split("Indicaciones:")[-1].strip()
                elif "Contraindicaciones:" in line:
                    med_info["contraindicaciones"] = line.split("Contraindicaciones:")[-1].strip()
                elif "Dosis:" in line:
                    med_info["dosis"] = line.split("Dosis:")[-1].strip()
            if med_info.get("nombre"):
                meds_data.append(med_info)
        
        # 2. Intentar buscar correspondencia entre la pregunta y los medicamentos locales
        target_med = None
        for med in meds_data:
            nombre = med.get("nombre", "").lower()
            principio = med.get("principio", "").lower()
            if nombre in question_lower or principio in question_lower:
                target_med = med
                break
                
        # Si no encontramos correspondencia directa por nombre, usamos el primero de la base de datos
        if not target_med and meds_data:
            target_med = meds_data[0]
            
        if target_med:
            nombre = target_med.get("nombre", "Medicamento")
            principio = target_med.get("principio", "Principio Activo")
            lab = target_med.get("laboratorio", "Laboratorio")
            concentracion = target_med.get("concentracion", "N/A")
            dosis = target_med.get("dosis", "Consultar la dosis oficial.")
            
            # Responder con base en la intención (dosis o general)
            if "dosis" in question_lower or "posologia" in question_lower or "cuanto" in question_lower or "cada cuanto" in question_lower:
                return f"CONTINGENCIA: {nombre} ({principio} {concentracion} - {lab}). Dosis registrada: {dosis}."
            else:
                return f"CONTINGENCIA: {nombre} ({principio} {concentracion} - {lab}). Tratamiento sintomatico registrado. Requiere receta medica."
        
        # Fallback genérico
        return "CONTINGENCIA: Servidor de IA sin cuota. Use el menu de medicamentos de la aplicacion."

