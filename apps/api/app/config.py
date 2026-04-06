from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RecruitFlow AI Elite API"
    app_version: str = "2.0.0"
    database_url: str = "sqlite:///./recruitflow.db"
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
