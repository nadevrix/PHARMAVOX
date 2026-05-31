import os
import json
import shutil
from pathlib import Path
from app.db.session import SessionLocal, engine
from app.models import Base
from app.models.leaflet_pdf import LeafletPDF
from app.models.medication import Medication
from app.services import pdf_service

PENDIENTES_DIR = Path("data/pdfs_pendientes")
UPLOAD_DIR = Path("data/pdfs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def seed_pdfs():
    # Asegurar creación de tablas primero
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("Iniciando sembrado de PDFs pendientes...")
    
    # Buscar todos los PDFs en pdfs_pendientes
    pdf_files = list(PENDIENTES_DIR.glob("*.pdf"))
    
    if not pdf_files:
        print("No se encontraron PDFs en data/pdfs_pendientes/")
        return

    for pdf_path in pdf_files:
        filename = pdf_path.name
        dest_path = UPLOAD_DIR / filename
        
        # 1. Comprobar si ya existe en la base de datos
        db_exists = db.query(LeafletPDF).filter(LeafletPDF.filename == filename).first()
        if db_exists:
            print(f"El PDF {filename} ya está registrado. Saltando...")
            continue
            
        print(f"Procesando: {filename}...")
        
        # Copiar el archivo físico a data/pdfs/
        shutil.copy(pdf_path, dest_path)
        
        try:
            # Leer bytes
            with open(dest_path, "rb") as f:
                pdf_bytes = f.read()
                
            # 2. Analizar el prospecto con Gemini
            print(f"Analizando {filename} con la IA...")
            extracted_data = pdf_service.analyze_pdf(pdf_bytes, filename=filename)
            
            # 3. Registrar LeafletPDF
            leaflet_rec = LeafletPDF(
                filename=filename,
                file_path=str(dest_path),
                file_size=len(pdf_bytes),
                raw_text=extracted_data.get("resumen_audio", ""),
                parsed_json=json.dumps(extracted_data, ensure_ascii=False),
                is_processed=True
            )
            db.add(leaflet_rec)
            db.commit()
            db.refresh(leaflet_rec)
            
            # 4. Registrar Medicamento para el RAG
            nombre = extracted_data.get("nombre_comercial") or extracted_data.get("principio_activo") or filename.replace(".pdf", "")
            principio = extracted_data.get("principio_activo") or "Desconocido"
            concentracion = extracted_data.get("concentracion") or "N/A"
            forma = extracted_data.get("forma_farmaceutica") or "N/A"
            lab = extracted_data.get("laboratorio") or "N/A"
            
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
            
            print(f"¡{filename} procesado y guardado con éxito como {nombre}!")
            
        except Exception as e:
            print(f"Error procesando {filename}: {e}")
            if dest_path.exists():
                dest_path.unlink()
                
    db.close()
    print("Sembrado finalizado.")

if __name__ == "__main__":
    seed_pdfs()
