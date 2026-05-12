from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RecruitFlow AI Elite API"
    app_version: str = "2.3.0"

    database_url: str = "sqlite:///./recruitflow.db"

    cors_origins: str = (
        "http://localhost:5173,"
        "https://recruitflow-ai-elite.vercel.app"
    )

    upload_dir: str = "uploads"
    embedding_model: str = "lightweight-sequence-similarity-v1"

    environment: str = "development"
    log_level: str = "info"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()