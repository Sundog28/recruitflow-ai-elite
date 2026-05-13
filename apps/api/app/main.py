from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.db import models
from app.routes.auth import router as auth_router
from app.routes.analyze import router as analyze_router
from app.routes.rewrite import router as rewrite_router
from app.routes.recruiter import router as recruiter_router
app.include_router(recruiter_router)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecruitFlow AI Elite API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(rewrite_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "RecruitFlow AI Elite API is running. Visit /docs for Swagger UI."
    }


@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "service": "RecruitFlow AI Elite API",
        "version": "2.1.0",
    }