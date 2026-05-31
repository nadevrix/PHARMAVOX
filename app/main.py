from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.models import Base
from app.models.user import User
from app.core.security import get_password_hash
from app.api.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa las tablas en la base de datos (SQLite o Postgres) al arrancar el servidor
    Base.metadata.create_all(bind=engine)
    
    # Sembrar el primer administrador y operarios iniciales
    db = SessionLocal()
    try:
        admin_email = "sergio@pharmavox.com"
        exists = db.query(User).filter(User.email == admin_email).first()
        if not exists:
            hashed_pwd = get_password_hash("miPasswordSeguro123")
            first_admin = User(
                email=admin_email,
                full_name="Sergio Gómez",
                hashed_password=hashed_pwd,
                role="admin",
                timezone="America/Caracas"
            )
            db.add(first_admin)
            print(f"[INFO] Administrador inicial '{admin_email}' preparado para siembra.")

        # Carlos Mendoza
        carlos_email = "carlos.mendoza@farmacorp.com"
        carlos_exists = db.query(User).filter(User.email == carlos_email).first()
        if not carlos_exists:
            hashed_pwd_carlos = get_password_hash("password123")
            carlos = User(
                email=carlos_email,
                full_name="Carlos Mendoza",
                hashed_password=hashed_pwd_carlos,
                role="pharmacist",
                timezone="America/Caracas"
            )
            db.add(carlos)
            print(f"[INFO] Operario inicial '{carlos_email}' preparado para siembra.")

        # Ana Gómez
        ana_email = "ana.gomez@farmacorp.com"
        ana_exists = db.query(User).filter(User.email == ana_email).first()
        if not ana_exists:
            hashed_pwd_ana = get_password_hash("password123")
            ana = User(
                email=ana_email,
                full_name="Ana Gómez",
                hashed_password=hashed_pwd_ana,
                role="pharmacist",
                timezone="America/Caracas"
            )
            db.add(ana)
            print(f"[INFO] Operario inicial '{ana_email}' preparado para siembra.")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error al sembrar base de datos inicial: {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuración de CORS para permitir solicitudes del Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modificar en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar las rutas de la API bajo el prefijo /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Endpoint de salud del sistema.
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_api_status": "configured" if settings.GEMINI_API_KEY else "missing_api_key"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
