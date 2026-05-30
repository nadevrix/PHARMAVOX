from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PharmaVox Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # API Keys y servicios externos
    GEMINI_API_KEY: str = ""
    
    # Base de Datos (Default SQLite local, se sobreescribe con Postgres en producción/docker)
    DATABASE_URL: str = "sqlite:///./pharmavox.db"
    
    # Servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
