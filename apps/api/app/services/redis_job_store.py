import json
from datetime import datetime
from uuid import uuid4

from app.services.redis_service import redis_client


JOB_PREFIX = "recruitflow:jobs:"
MEMORY_JOBS = {}


def _job_key(job_id: str):
    return f"{JOB_PREFIX}{job_id}"


def _now():
    return datetime.utcnow().isoformat()


def _redis_available():
    try:
        redis_client.ping()
        return True
    except Exception:
        return False


def create_job(
    job_type: str,
    payload: dict | None = None,
):
    job_id = str(uuid4())

    job = {
        "job_id": job_id,
        "job_type": job_type,
        "status": "queued",
        "payload": payload or {},
        "result": None,
        "error": None,
        "created_at": _now(),
        "updated_at": _now(),
    }

    if _redis_available():
        try:
            redis_client.set(
                _job_key(job_id),
                json.dumps(job),
            )
            return job
        except Exception:
            pass

    MEMORY_JOBS[job_id] = job
    return job


def update_job(
    job_id: str,
    status: str,
    result=None,
    error=None,
):
    existing = get_job(job_id)

    if not existing:
        return None

    existing["status"] = status
    existing["result"] = result
    existing["error"] = error
    existing["updated_at"] = _now()

    if _redis_available():
        try:
            redis_client.set(
                _job_key(job_id),
                json.dumps(existing),
            )
            return existing
        except Exception:
            pass

    MEMORY_JOBS[job_id] = existing
    return existing


def get_job(job_id: str):
    if _redis_available():
        try:
            value = redis_client.get(_job_key(job_id))

            if value:
                return json.loads(value)
        except Exception:
            pass

    return MEMORY_JOBS.get(job_id)


def list_jobs(limit: int = 100):
    jobs = []

    if _redis_available():
        try:
            keys = redis_client.keys(f"{JOB_PREFIX}*")

            for key in keys:
                value = redis_client.get(key)

                if value:
                    jobs.append(json.loads(value))

        except Exception:
            jobs = []

    if not jobs:
        jobs = list(MEMORY_JOBS.values())

    jobs.sort(
        key=lambda job: job["created_at"],
        reverse=True,
    )

    return {
        "count": len(jobs),
        "jobs": jobs[:limit],
    }