from fastapi import APIRouter
from app.api.endpoints import scan, assistant, simplifier, scheduler

api_router = APIRouter()

# Registro de sub-routers con sus respectivos prefijos y etiquetas semánticas
api_router.include_router(scan.router, tags=["OCR & Scanner"])
api_router.include_router(assistant.router, tags=["Vox Assistant"])
api_router.include_router(simplifier.router, tags=["Leaflet Simplifier"])
api_router.include_router(scheduler.router, tags=["Dosage Scheduler"])
