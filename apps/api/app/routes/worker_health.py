import os

from fastapi import APIRouter


router = APIRouter(
    prefix="/api/v1/workers",
    tags=["workers"],
)


def check_redis_connection():
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


def check_rq_queue():
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


@router.get("/health")
def worker_health():
    redis_status = check_redis_connection()
    queue_status = check_rq_queue()

    healthy = (
        redis_status.get("connected") is True
        and queue_status.get("status") == "ok"
    )

    return {
        "healthy": healthy,
        "service": "RecruitFlow AI Worker Infrastructure",
        "checks": {
            "redis": redis_status,
            "queue": queue_status,
        },
    }