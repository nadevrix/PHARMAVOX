from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

# Cargar explícitamente el archivo .env al entorno de ejecución de Python
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str
    VERSION: str
    API_V1_STR: str
    
    # API Keys y servicios externos
    GEMINI_API_KEY: str
    
    # Base de Datos PostgreSQL / SQLite
    DATABASE_URL: str
    
    # Credenciales específicas de PostgreSQL (para Docker / Producción)
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # Servidor
    HOST: str
    PORT: int
    DEBUG: bool

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
