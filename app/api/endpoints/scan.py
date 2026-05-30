from fastapi import APIRouter, UploadFile, File
from app.schemas.scan import ScanResponse, MedicationScanInfo

router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
async def scan_medication(file: UploadFile = File(...)):
    """
    Escanea y analiza una imagen de una caja de medicamento, frasco o receta médica.
    Extrae metadatos estructurados utilizando IA multimodal (Gemini).
    """
    # Placeholder / Mock response para desarrollo ágil y desacoplado
    return ScanResponse(
        success=True,
        medication=MedicationScanInfo(
            name="Ibuprofeno 600mg",
            active_ingredient="Ibuprofeno",
            concentration="600 mg",
            presentation="Comprimidos (Caja de 20 unidades)",
            manufacturer="Laboratorios Generics S.A."
        ),
        quick_summary="Medicamento antiinflamatorio indicado para el alivio del dolor y la fiebre.",
        critical_warnings=[
            "No tomar en caso de úlcera gástrica activa.",
            "Evitar el consumo de alcohol durante el tratamiento."
        ]
    )
