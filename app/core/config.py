from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

# Cargar explícitamente el archivo .env al entorno de ejecución de Python
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "PharmaVox"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # API Keys y servicios externos
    GEMINI_API_KEY: str = "mock_key_for_demo"
    
    # Base de Datos PostgreSQL / SQLite
    DATABASE_URL: str = "sqlite:///./pharmavox.db"
    
    # Credenciales específicas de PostgreSQL (para Docker / Producción)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "pharmavox_db"
    
    # Servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
