from fastapi import APIRouter
from app.api.endpoints import assistant, admin_users, admin_pdfs

api_router = APIRouter()

# Registro de sub-routers con sus respectivos prefijos y etiquetas semánticas
api_router.include_router(assistant.router, tags=["Vox Assistant"])
api_router.include_router(admin_users.router, tags=["Admin Users"])
api_router.include_router(admin_pdfs.router, tags=["Admin PDFs"])
