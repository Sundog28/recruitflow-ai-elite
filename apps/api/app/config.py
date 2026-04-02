from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class Settings:
    database_url: str
    model_path: str
    cors_origins: str
    port: int


@lru_cache
def get_settings() -> Settings:
    default_db = f"sqlite:///{PROJECT_ROOT / 'recruitflow.db'}"
    default_model = str(PROJECT_ROOT / 'ml' / 'models' / 'fit_model.joblib')
    return Settings(
        database_url=os.getenv("DATABASE_URL", default_db),
        model_path=os.getenv("MODEL_PATH", default_model),
        cors_origins=",".join(
            [
                part.strip()
                for part in os.getenv(
                    "CORS_ORIGINS",
                    "http://localhost:5173,http://127.0.0.1:5173",
                ).split(",")
                if part.strip()
            ]
        ),
        port=int(os.getenv("PORT", "8000")),
    )
