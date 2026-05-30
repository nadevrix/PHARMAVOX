from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# ⚠️ DETALLE DE PERSISTENCIA:
# La base de datos principal y oficial de PharmaVox es POSTGRESQL (definida en docker-compose.yml y .env).
# Para facilitar el desarrollo local rápido sin necesidad de levantar contenedores, 
# soportamos un fallback dinámico a SQLite local si la cadena de conexión inicia con "sqlite".
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Creación del motor de conexión de la base de datos (PostgreSQL o SQLite según .env)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True  # Verifica automáticamente si la base de datos está conectada y activa
)

# Generador de sesiones de base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Clase base declarativa para el ORM de SQLAlchemy
Base = declarative_base()

def get_db():
    """
    Dependency helper para obtener una sesión de base de datos limpia por petición HTTP.
    Se cierra de forma segura al finalizar la petición (gracias al yield).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
