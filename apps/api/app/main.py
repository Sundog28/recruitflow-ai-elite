from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.billing import router as billing_router
from app.db.database import Base
from app.db.database import engine
from app.db import models

from app.routes.analyze import router as analyze_router
from app.routes.rewrite import router as rewrite_router
from app.routes.auth import router as auth_router
from app.routes.recruiter import router as recruiter_router
from app.routes.team import router as team_router
from app.routes.copilot import router as copilot_router

Base.metadata.create_all(bind=engine)


def run_startup_migrations():
    migration_queries = [
        "ALTER TABLE analysis_records ADD COLUMN recruiter_id INTEGER",
        "ALTER TABLE analysis_records ADD COLUMN team_id INTEGER",
        "ALTER TABLE analysis_records ADD COLUMN candidate_status VARCHAR(50) DEFAULT 'screening'",
        "ALTER TABLE analysis_records ADD COLUMN recruiter_notes TEXT",
        "ALTER TABLE analysis_records ADD COLUMN candidate_tags TEXT",
        "ALTER TABLE analysis_records ADD COLUMN bookmarked BOOLEAN DEFAULT false",
        "ALTER TABLE recruiter_users ADD COLUMN team_id INTEGER",
        "ALTER TABLE recruiter_users ADD COLUMN role VARCHAR(50) DEFAULT 'recruiter'",
        "ALTER TABLE recruiter_users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free'",
        "ALTER TABLE recruiter_users ADD COLUMN stripe_customer_id VARCHAR(255)",
        "ALTER TABLE recruiter_users ADD COLUMN stripe_subscription_id VARCHAR(255)",
        "ALTER TABLE recruiter_users ADD COLUMN plan_name VARCHAR(100) DEFAULT 'free'",
        "ALTER TABLE recruiter_users ADD COLUMN plan VARCHAR(50) DEFAULT 'free'",
    ]

    for query in migration_queries:
        try:
            print(f"RUNNING MIGRATION: {query}")

            with engine.begin() as connection:
                connection.execute(text(query))

        except Exception as e:
            print(f"MIGRATION SKIPPED: {e}")


run_startup_migrations()

app = FastAPI(
    title="RecruitFlow AI Elite API",
    version="2.6.0",
)

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
app.include_router(recruiter_router)
app.include_router(team_router)
app.include_router(copilot_router)
app.include_router(billing_router)

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
        "version": "2.6.0",
    }