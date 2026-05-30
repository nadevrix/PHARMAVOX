from fastapi import APIRouter
from app.schemas.assistant import AskRequest, AskResponse, VisualLayout

router = APIRouter()

@router.post("/ask", response_model=AskResponse)
async def ask_assistant(request: AskRequest):
    """
    Realiza preguntas conversacionales sobre el medicamento analizado.
    Retorna respuesta textual, fonética para voz y layout de UI para computador.
    """
    # Respuestas de ejemplo basadas en el contexto enviado
    question_lower = request.question.lower()
    
    if "estómago vacío" in question_lower or "comer" in question_lower:
        text = "Se recomienda encarecidamente tomar el ibuprofeno con comida o después de comer para evitar la irritación del estómago."
        voice = "Es mejor que tomes el ibuprofeno acompañado de comida o con un vaso de leche. Así protegerás tu estómago."
        layout = VisualLayout(
            display_mode="card",
            card_type="warning",
            title="Instrucción de Consumo",
            content_bullets=[
                "Tomar con alimentos o leche.",
                "Evita la irritación del estómago."
            ],
            highlight_color="#E11D48"
        )
    else:
        text = f"El Ibuprofeno es un antiinflamatorio no esteroideo (AINE). Respecto a tu pregunta: '{request.question}', te recordamos seguir las pautas de tu médico."
        voice = f"Sobre tu consulta de {request.medication_context}, es importante consultar a tu médico. Recuerda respetar la dosis recomendada."
        layout = VisualLayout(
            display_mode="card",
            card_type="info",
            title="Información General",
            content_bullets=[
                "Sigue las indicaciones médicas.",
                "No excedas los 1200mg diarios sin receta."
            ],
            highlight_color="#3B82F6"
        )

    return AskResponse(
        text_response=text,
        voice_response=voice,
        visual_layout=layout,
        audio_chunks=[]
    )
