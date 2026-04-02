from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.database import Base, engine
from app.db import models as _db_models  # noqa: F401 - ensure models are imported before create_all
from app.routes.analyze import router as analyze_router

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecruitFlow AI API", version="0.2.0")
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analyze_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "RecruitFlow AI API is running. Visit /docs for Swagger UI."}
