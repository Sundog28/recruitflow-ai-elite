import os

from fastapi import APIRouter
from sqlalchemy import text

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/metrics",
    tags=["metrics"],
)


def safe_count(model):
    db = SessionLocal()

    try:
        return db.query(model).count()

    except Exception:
        return None

    finally:
        db.close()


def database_status():
    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "connected": True,
            "status": "ok",
        }

    except Exception as exc:
        return {
            "connected": False,
            "status": "error",
            "error": str(exc),
        }

    finally:
        db.close()


def redis_status():
    redis_url = os.getenv("REDIS_URL")

    if not redis_url:
        return {
            "configured": False,
            "connected": False,
            "status": "not_configured",
        }

    try:
        import redis

        client = redis.from_url(
            redis_url,
            decode_responses=True,
        )

        client.ping()

        return {
            "configured": True,
            "connected": True,
            "status": "ok",
        }

    except Exception as exc:
        return {
            "configured": True,
            "connected": False,
            "status": "error",
            "error": str(exc),
        }


def queue_status():
    redis_url = os.getenv("REDIS_URL")

    if not redis_url:
        return {
            "configured": False,
            "status": "not_configured",
        }

    try:
        import redis
        from rq import Queue

        connection = redis.from_url(
            redis_url,
            decode_responses=True,
        )

        queue = Queue(
            "recruitflow-ai",
            connection=connection,
        )

        return {
            "configured": True,
            "status": "ok",
            "queue_name": queue.name,
            "queued_jobs": len(queue),
        }

    except Exception as exc:
        return {
            "configured": True,
            "status": "error",
            "error": str(exc),
        }


@router.get("/summary")
def metrics_summary():
    return {
        "service": "RecruitFlow AI Elite API",
        "environment": os.getenv("APP_ENV", "development"),
        "api": {
            "status": "ok",
        },
        "database": database_status(),
        "redis": redis_status(),
        "queue": queue_status(),
        "counts": {
            "recruiters": safe_count(RecruiterUser),
            "candidates": safe_count(AnalysisRecord),
        },
    }