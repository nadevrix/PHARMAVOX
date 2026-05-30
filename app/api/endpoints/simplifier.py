from fastapi import APIRouter
from app.schemas.simplifier import SimplifyRequest, SimplifyResponse, SimplifiedSection

router = APIRouter()

@router.post("/simplify", response_model=SimplifyResponse)
async def simplify_leaflet(request: SimplifyRequest):
    """
    Simplifica textos clínicos complejos y prospectos médicos.
    Retorna un título simple y secciones en tarjetas amigables.
    """
    return SimplifyResponse(
        simplified_title="Guía Fácil de Ibuprofeno 600mg",
        sections=[
            SimplifiedSection(
                title="¿Para qué sirve?",
                description="Sirve para calmar dolores comunes de cabeza, dientes, y reducir la fiebre o inflamación.",
                icon="pain_relief"
            ),
            SimplifiedSection(
                title="¿Cómo tomarlo?",
                description="Toma 1 pastilla cada 8 horas, preferiblemente con alimentos. No tomes más de 3 al día.",
                icon="dosage"
            ),
            SimplifiedSection(
                title="¡Cuidado con esto!",
                description="Si tienes problemas de estómago frecuentes o estás embarazada, no debes tomarlo sin consultar a tu médico.",
                icon="warning"
            )
        ]
    )
