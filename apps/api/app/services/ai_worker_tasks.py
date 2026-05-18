from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)

from app.services.redis_job_store import update_job


def run_ai_candidate_summary_job(
    job_id: str,
    candidate_id: int,
):
    db: Session = SessionLocal()

    try:
        update_job(
            job_id=job_id,
            status="running",
        )

        candidate = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not candidate:
            update_job(
                job_id=job_id,
                status="failed",
                error="Candidate not found.",
            )
            return

        question = """
Generate a recruiter-ready candidate summary.

Include:
1. Executive summary
2. Best-fit role type
3. Key strengths
4. Risks or concerns
5. Interview focus areas
6. Hire / hold / reject recommendation
7. Final recruiter note

Keep it concise but useful for a hiring manager.
"""

        result = generate_openai_recruiter_response(
            candidate=candidate,
            question=question,
        )

        update_job(
            job_id=job_id,
            status="completed",
            result={
                "candidate_id": candidate_id,
                "candidate_name": candidate.candidate_name,
                "fit_score": candidate.fit_score,
                "summary": result["answer"],
                "model": result["model"],
                "ai_provider": "openai",
            },
        )

    except Exception as error:
        update_job(
            job_id=job_id,
            status="failed",
            error=str(error),
        )

    finally:
        db.close()


def run_ai_interview_evaluation_job(
    job_id: str,
    candidate_id: int,
    interview_notes: str,
):
    db: Session = SessionLocal()

    try:
        update_job(
            job_id=job_id,
            status="running",
        )

        candidate = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not candidate:
            update_job(
                job_id=job_id,
                status="failed",
                error="Candidate not found.",
            )
            return

        question = f"""
Evaluate this candidate's interview performance using the candidate profile
and the recruiter interview notes below.

Interview notes:
{interview_notes}

Return:
1. Overall interview score from 1-100
2. Communication quality
3. Technical depth
4. Role alignment
5. Strengths shown in interview
6. Risks or weak signals
7. Follow-up questions
8. Hire / hold / reject recommendation
9. Final interviewer summary
"""

        result = generate_openai_recruiter_response(
            candidate=candidate,
            question=question,
        )

        update_job(
            job_id=job_id,
            status="completed",
            result={
                "candidate_id": candidate_id,
                "candidate_name": candidate.candidate_name,
                "fit_score": candidate.fit_score,
                "interview_evaluation": result["answer"],
                "model": result["model"],
                "ai_provider": "openai",
            },
        )

    except Exception as error:
        update_job(
            job_id=job_id,
            status="failed",
            error=str(error),
        )

    finally:
        db.close()