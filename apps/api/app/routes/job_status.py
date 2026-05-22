from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from app.core.auth_dependencies import get_current_recruiter
from app.db.models import RecruiterUser

try:
    from app.routes.ai_jobs import AI_JOBS
except Exception:
    AI_JOBS = {}


router = APIRouter(
    prefix="/api/v1/jobs",
    tags=["jobs"],
)


@router.get("/{job_id}")
def get_job_status(
    job_id: str,
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    job = AI_JOBS.get(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    return {
        "job_id": job.get("job_id"),
        "job_type": job.get("job_type"),
        "status": job.get("status"),
        "payload": job.get("payload"),
        "result": job.get("result"),
        "error": job.get("error"),
        "retry_count": job.get("retry_count", 0),
        "max_retries": job.get("max_retries", 3),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
        "started_at": job.get("started_at"),
        "completed_at": job.get("completed_at"),
    }


@router.get("/")
def list_recent_jobs(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    jobs = list(AI_JOBS.values())

    jobs = sorted(
        jobs,
        key=lambda item: item.get("created_at") or "",
        reverse=True,
    )

    return {
        "count": len(jobs[:25]),
        "jobs": jobs[:25],
    }