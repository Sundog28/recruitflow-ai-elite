from sqlalchemy import text

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.rate_limit import limiter

from app.db.database import Base
from app.db.database import engine
from app.db import models

from app.routes.analyze import router as analyze_router
from app.routes.rewrite import router as rewrite_router
from app.routes.auth import router as auth_router
from app.routes.recruiter import router as recruiter_router
from app.routes.team import router as team_router
from app.routes.copilot import router as copilot_router
from app.routes.billing import router as billing_router
from app.routes.ai_summary import router as ai_summary_router
from app.routes.vector_search import router as vector_search_router
from app.routes.ai_intelligence import router as ai_intelligence_router
from app.routes.invitations import router as invitations_router
from app.routes.team_collaboration import router as team_collaboration_router
from app.routes.team_security import router as team_security_router
from app.routes.team_billing import router as team_billing_router
from app.routes.ai_jobs import router as ai_jobs_router

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
        "ALTER TABLE recruiter_users ADD COLUMN analyses_used INTEGER DEFAULT 0",
        "CREATE EXTENSION IF NOT EXISTS vector",
        "ALTER TABLE analysis_records ADD COLUMN embedding_text TEXT",
        "ALTER TABLE analysis_records ADD COLUMN embedding_model VARCHAR(100)",
        "ALTER TABLE analysis_records ADD COLUMN candidate_embedding vector(384)",
        "ALTER TABLE recruiter_teams ADD COLUMN plan_name VARCHAR(100) DEFAULT 'free'",
        "ALTER TABLE recruiter_teams ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free'",
        "ALTER TABLE recruiter_teams ADD COLUMN stripe_customer_id VARCHAR(255)",
        "ALTER TABLE recruiter_teams ADD COLUMN stripe_subscription_id VARCHAR(255)",
        "ALTER TABLE recruiter_teams ADD COLUMN seat_count INTEGER DEFAULT 1",
        "ALTER TABLE recruiter_teams ADD COLUMN seat_limit INTEGER DEFAULT 1",
        """
        CREATE TABLE recruiter_invitations (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            email VARCHAR(255) NOT NULL,
            invited_by_user_id INTEGER,
            team_id INTEGER NOT NULL,
            role VARCHAR(50) DEFAULT 'recruiter',
            invitation_token VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            accepted_at TIMESTAMP NULL
        )
        """
        """
        CREATE TABLE team_candidate_comments (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            team_id INTEGER NOT NULL,
            candidate_id INTEGER NOT NULL,
            recruiter_user_id INTEGER,
            comment TEXT NOT NULL,
            visibility VARCHAR(50) DEFAULT 'team'
        )
        """
        """
        CREATE TABLE team_role_permissions (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            role_name VARCHAR(50) UNIQUE NOT NULL,
            can_manage_team BOOLEAN DEFAULT FALSE,
            can_manage_candidates BOOLEAN DEFAULT FALSE,
            can_leave_comments BOOLEAN DEFAULT TRUE,
            can_view_pipeline BOOLEAN DEFAULT TRUE,
            can_manage_billing BOOLEAN DEFAULT FALSE,
            can_invite_recruiters BOOLEAN DEFAULT FALSE
        )
        """,

        """
        CREATE TABLE team_audit_logs (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            team_id INTEGER NOT NULL,
            recruiter_user_id INTEGER,
            action_type VARCHAR(100) NOT NULL,
            target_type VARCHAR(100),
            target_id INTEGER,
            action_summary TEXT NOT NULL,
            metadata_json TEXT
        )
        """
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
    version="2.7.0",
)

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
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
app.include_router(ai_summary_router)
app.include_router(vector_search_router)
app.include_router(ai_intelligence_router)
app.include_router(invitations_router)
app.include_router(team_collaboration_router)
app.include_router(team_security_router)
app.include_router(team_billing_router)
app.include_router(ai_jobs_router)

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
        "version": "2.7.0",
    }