import json
from datetime import datetime
from uuid import uuid4

from app.services.redis_service import redis_client


JOB_PREFIX = "recruitflow:jobs:"


def _job_key(job_id: str):
    return f"{JOB_PREFIX}{job_id}"


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
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    redis_client.set(
        _job_key(job_id),
        json.dumps(job),
    )

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
    existing["updated_at"] = (
        datetime.utcnow().isoformat()
    )

    redis_client.set(
        _job_key(job_id),
        json.dumps(existing),
    )

    return existing


def get_job(job_id: str):
    value = redis_client.get(_job_key(job_id))

    if not value:
        return None

    return json.loads(value)


def list_jobs(limit: int = 100):
    keys = redis_client.keys(f"{JOB_PREFIX}*")

    jobs = []

    for key in keys:
        value = redis_client.get(key)

        if value:
            jobs.append(json.loads(value))

    jobs.sort(
        key=lambda x: x["created_at"],
        reverse=True,
    )

    return {
        "count": len(jobs),
        "jobs": jobs[:limit],
    }