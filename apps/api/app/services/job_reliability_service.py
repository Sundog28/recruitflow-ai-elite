from datetime import datetime
import traceback


MAX_JOB_RETRIES = 3


def mark_job_running(job: dict):
    job["status"] = "running"
    job["updated_at"] = datetime.utcnow().isoformat()
    job["started_at"] = datetime.utcnow().isoformat()
    return job


def mark_job_completed(
    job: dict,
    result,
):
    job["status"] = "completed"
    job["result"] = result
    job["error"] = None
    job["updated_at"] = datetime.utcnow().isoformat()
    job["completed_at"] = datetime.utcnow().isoformat()
    return job


def mark_job_failed(
    job: dict,
    error: Exception,
):
    retry_count = job.get("retry_count", 0) + 1

    job["retry_count"] = retry_count
    job["updated_at"] = datetime.utcnow().isoformat()
    job["error"] = str(error)
    job["traceback"] = traceback.format_exc()

    if retry_count >= job.get("max_retries", MAX_JOB_RETRIES):
        job["status"] = "failed_permanent"
    else:
        job["status"] = "failed_retryable"

    return job


def create_reliable_job_payload(
    job_id: str,
    job_type: str,
    payload: dict,
):
    now = datetime.utcnow().isoformat()

    return {
        "job_id": job_id,
        "job_type": job_type,
        "status": "queued",
        "payload": payload,
        "result": None,
        "error": None,
        "traceback": None,
        "retry_count": 0,
        "max_retries": MAX_JOB_RETRIES,
        "created_at": now,
        "updated_at": now,
        "started_at": None,
        "completed_at": None,
    }