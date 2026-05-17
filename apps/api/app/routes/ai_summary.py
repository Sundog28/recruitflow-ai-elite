from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)

router = APIRouter(
    prefix="/api/v1/ai-summary",
    tags=["ai-summary"],
)


@router.get("/candidate/{candidate_id}")
def generate_ai_candidate_summary(
    candidate_id: int,
):
    db: Session = SessionLocal()

    try:
        candidate = (
            db.query(AnalysisRecord)
            .filter(
                AnalysisRecord.id == candidate_id
            )
            .first()
        )

        if not candidate:
            return {
                "detail": "Candidate not found.",
            }

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

        result = (
            generate_openai_recruiter_response(
                candidate=candidate,
                question=question,
            )
        )

        return {
            "candidate_id": candidate_id,
            "candidate_name": (
                candidate.candidate_name
            ),
            "fit_score": candidate.fit_score,
            "summary": result["answer"],
            "model": result["model"],
            "ai_provider": "openai",
        }

    finally:
        db.close()