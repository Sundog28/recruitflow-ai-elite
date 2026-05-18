from datetime import datetime
from typing import Any
from typing import Dict
from uuid import uuid4


JOBS: Dict[str, Dict[str, Any]] = {}


def create_job(
    job_type: str,
    payload: dict | None = None,
) -> dict:
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

    JOBS[job_id] = job

    return job


def update_job(
    job_id: str,
    status: str,
    result: Any = None,
    error: str | None = None,
) -> dict | None:
    job = JOBS.get(job_id)

    if not job:
        return None

    job["status"] = status
    job["result"] = result
    job["error"] = error
    job["updated_at"] = datetime.utcnow().isoformat()

    JOBS[job_id] = job

    return job


def get_job(job_id: str) -> dict | None:
    return JOBS.get(job_id)


def list_jobs() -> dict:
    jobs = list(JOBS.values())

    jobs.sort(
        key=lambda job: job["created_at"],
        reverse=True,
    )

    return {
        "count": len(jobs),
        "jobs": jobs[:100],
    }