from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import json
from pathlib import Path

from app.db.session import get_db
from app.models.leaflet_pdf import LeafletPDF
from app.models.medication import Medication
from app.schemas.leaflet_pdf import LeafletPDFOut, LeafletPDFUpdate
from app.services import pdf_service

router = APIRouter()

UPLOAD_DIR = Path("data/pdfs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def require_role(allowed_roles: List[str]):
    def dependency(x_role: str = Header("pharmacist", description="Roles: admin, pharmacist")):
        if x_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requieren permisos de: {', '.join(allowed_roles)}"
            )
        return x_role
    return dependency

@router.post("/admin/pdfs", response_model=LeafletPDFOut, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: str = Depends(require_role(["admin"]))
):
    """
    Carga un archivo PDF de prospecto técnico oficial, lo procesa con Gemini 1.5 Flash
    y persiste la información estructurada en la Base de Datos. (Solo Admin)
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se admiten archivos en formato PDF."
        )

    # 1. Leer bytes y guardar archivo localmente
    pdf_bytes = await file.read()
    file_path = UPLOAD_DIR / file.filename

    # Evita sobrescribir archivos con el mismo nombre añadiendo timestamp si es necesario en disco o BD
    db_exists = db.query(LeafletPDF).filter(LeafletPDF.file_path == str(file_path)).first()
    if file_path.exists() or db_exists:
        import time
        file_path = UPLOAD_DIR / f"{Path(file.filename).stem}_{int(time.time())}.pdf"


    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    try:
        # 2. Analizar el prospecto con Gemini 1.5/2.5 Flash multimodal, indicando el filename para redundancia
        extracted_data = pdf_service.analyze_pdf(pdf_bytes, filename=file.filename)
        
        # 3. Guardar registro en leaflet_pdfs
        leaflet_rec = LeafletPDF(
            filename=file.filename,
            file_path=str(file_path),
            file_size=len(pdf_bytes),
            raw_text=extracted_data.get("resumen_audio", ""),
            parsed_json=json.dumps(extracted_data, ensure_ascii=False),
            is_processed=True
        )
        db.add(leaflet_rec)
        db.commit()
        db.refresh(leaflet_rec)

        # 4. Guardar o actualizar la información del medicamento en la tabla medications
        # (Esto servirá de RAG / Base de conocimiento local para el asistente)
        nombre = extracted_data.get("nombre_comercial") or extracted_data.get("principio_activo") or "Desconocido"
        principio = extracted_data.get("principio_activo") or "Desconocido"
        concentracion = extracted_data.get("concentracion") or "N/A"
        forma = extracted_data.get("forma_farmaceutica") or "N/A"
        lab = extracted_data.get("laboratorio") or "N/A"

        # Construye un texto extenso combinado para indexar todo el conocimiento clínico
        raw_leaflet_text = (
            f"Ficha Técnica de {nombre}\n"
            f"Principio Activo: {principio}\n"
            f"Laboratorio: {lab}\n"
            f"Vía: {extracted_data.get('via_administracion') or 'N/A'}\n"
            f"Indicaciones: {', '.join(extracted_data.get('indicaciones', []))}\n"
            f"Contraindicaciones: {', '.join(extracted_data.get('contraindicaciones', []))}\n"
            f"Interacciones: {', '.join(extracted_data.get('interacciones', []))}\n"
            f"Efectos Adversos: {', '.join(extracted_data.get('efectos_adversos', []))}\n"
            f"Dosis: {extracted_data.get('dosis_recomendada') or 'N/A'}"
        )

        medication_rec = Medication(
            name=nombre,
            active_ingredient=principio,
            concentration=concentracion,
            presentation=forma,
            manufacturer=lab,
            raw_leaflet_text=raw_leaflet_text,
            simplified_summary=extracted_data.get("resumen_audio", "")
        )
        db.add(medication_rec)
        db.commit()

        return leaflet_rec

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error grave en upload_pdf: {e}", exc_info=True)
        # Si falla el análisis, elimina el archivo físico para no dejar basura
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo al procesar el prospecto con la inteligencia artificial: {str(e)}"
        )


@router.get("/pdfs", response_model=List[LeafletPDFOut])
async def list_pdfs(
    db: Session = Depends(get_db),
    _role: str = Depends(require_role(["admin", "pharmacist"]))
):
    """
    Lista todos los prospectos PDF registrados y procesados en el sistema. (Admin y Pharmacist)
    """
    return db.query(LeafletPDF).all()

@router.put("/admin/pdfs/{pdf_id}", response_model=LeafletPDFOut)
async def update_pdf_metadata(
    pdf_id: int,
    pdf_in: LeafletPDFUpdate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_role(["admin"]))
):
    """
    Actualiza la metadata básica de un PDF registrado. (Solo Admin)
    """
    db_pdf = db.query(LeafletPDF).filter(LeafletPDF.id == pdf_id).first()
    if not db_pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de PDF no encontrado."
        )

    update_data = pdf_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_pdf, field, value)

    db.commit()
    db.refresh(db_pdf)
    return db_pdf

@router.delete("/admin/pdfs/{pdf_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pdf(
    pdf_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_role(["admin"]))
):
    """
    Elimina por completo el archivo PDF del disco y borra su registro del sistema. (Solo Admin)
    """
    db_pdf = db.query(LeafletPDF).filter(LeafletPDF.id == pdf_id).first()
    if not db_pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de PDF no encontrado."
        )

    # 1. Elimina el archivo físico de disco
    try:
        if os.path.exists(db_pdf.file_path):
            os.remove(db_pdf.file_path)
    except Exception as e:
        # Continuar borrando de BD aunque falle borrar archivo
        pass

    # 2. Si es posible, limpiar cachés asociadas a medicamentos basados en este PDF
    try:
        parsed_data = json.loads(db_pdf.parsed_json) if db_pdf.parsed_json else {}
        nombre = parsed_data.get("nombre_comercial")
        if nombre:
            db.query(Medication).filter(Medication.name == nombre).delete()
    except Exception:
        pass

    # 3. Eliminar registro
    db.delete(db_pdf)
    db.commit()
    return None

@router.get("/pdfs/{pdf_id}/download")
async def download_pdf(
    pdf_id: int,
    db: Session = Depends(get_db),
    _role: str = Depends(require_role(["admin", "pharmacist"]))
):
    """
    Descarga o transmite en tiempo real el archivo PDF para renderizado en frontend. (Admin y Pharmacist)
    """
    db_pdf = db.query(LeafletPDF).filter(LeafletPDF.id == pdf_id).first()
    if not db_pdf or not os.path.exists(db_pdf.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico del PDF no se encuentra en el servidor."
        )

    return FileResponse(
        path=db_pdf.file_path,
        media_type="application/pdf",
        filename=db_pdf.filename
    )
