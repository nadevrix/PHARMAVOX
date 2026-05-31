import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# ⚠️ DETALLE DE PERSISTENCIA Y RESILIENCIA EN LA NUBE:
# La base de datos principal de PharmaVox está configurada por defecto a SQLite para desarrollo rápido.
# Si el entorno (ej. Railway) provee una base de datos PostgreSQL, intentamos conectarnos a ella.
# Si la conexión a PostgreSQL falla (por ejemplo, host 'db' no encontrado en cold-starts o variables desconfiguradas),
# caemos en un fallback automático y resiliente a SQLite local, asegurando que la aplicación NUNCA se caiga al iniciar.

def get_resilient_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    try:
        # Intentamos crear el motor
        test_engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True
        )
        # Probamos de verdad la conexión
        with test_engine.connect() as conn:
            pass
        return test_engine
    except Exception as e:
        print(f"[WARNING] No se pudo conectar a la base de datos principal ({db_url}): {e}.", file=sys.stderr)
        print(f"[WARNING] Activando motor de base de datos resiliente: Fallback a SQLite local.", file=sys.stderr)
        
        fallback_url = "sqlite:///./pharmavox.db"
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )

# Creación del motor de conexión de forma ultra-resiliente
engine = get_resilient_engine()

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
    Se cierra de forma segura al finalizar la petición.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
