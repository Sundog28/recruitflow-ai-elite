from fastapi import APIRouter
from fastapi import Form

from app.services.ai_worker_tasks import (
    run_ai_candidate_summary_job,
    run_ai_interview_evaluation_job,
)

from app.services.redis_job_store import (
    create_job,
    get_job,
    list_jobs,
)

from app.services.rq_queue import ai_queue


router = APIRouter(
    prefix="/api/v1/ai-jobs",
    tags=["ai-jobs"],
)


@router.post("/candidate/{candidate_id}/summary")
def queue_ai_candidate_summary(
    candidate_id: int,
):
    job = create_job(
        job_type="ai_candidate_summary",
        payload={
            "candidate_id": candidate_id,
        },
    )

    rq_job = ai_queue.enqueue(
        run_ai_candidate_summary_job,
        job["job_id"],
        candidate_id,
    )

    return {
        "message": "AI candidate summary job queued.",
        "job": job,
        "queue": {
            "name": ai_queue.name,
            "rq_job_id": rq_job.id,
        },
    }


@router.post("/candidate/{candidate_id}/interview-evaluation")
def queue_ai_interview_evaluation(
    candidate_id: int,
    interview_notes: str = Form(...),
):
    job = create_job(
        job_type="ai_interview_evaluation",
        payload={
            "candidate_id": candidate_id,
            "interview_notes": interview_notes,
        },
    )

    rq_job = ai_queue.enqueue(
        run_ai_interview_evaluation_job,
        job["job_id"],
        candidate_id,
        interview_notes,
    )

    return {
        "message": "AI interview evaluation job queued.",
        "job": job,
        "queue": {
            "name": ai_queue.name,
            "rq_job_id": rq_job.id,
        },
    }


@router.get("/{job_id}")
def get_ai_job(job_id: str):
    job = get_job(job_id)

    if not job:
        return {
            "detail": "Job not found.",
        }

    return job


@router.get("")
def list_ai_jobs():
    return list_jobs()