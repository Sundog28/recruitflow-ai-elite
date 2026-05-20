from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser
from app.services.openai_recruiter_service import generate_openai_recruiter_response

router = APIRouter(
    prefix="/api/v1/scorecards",
    tags=["scorecards"],
)


@router.get("/candidate/{candidate_id}")
def generate_candidate_scorecard(
    candidate_id: int,
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    candidate = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .first()
    )

    if not candidate:
        return {
            "detail": "Candidate not found.",
        }

    question = """
Generate a recruiter-ready hiring scorecard for this candidate.

Return:
1. Overall hiring score from 1-100
2. Technical skills score from 1-100
3. Role alignment score from 1-100
4. Project evidence score from 1-100
5. Communication/interview risk score from 1-100
6. Top strengths
7. Main concerns
8. Missing evidence
9. Interview focus areas
10. Final decision: strong hire / hire / hold / reject
11. Hiring manager summary

Be practical, concise, and evidence-based.
Do not invent experience that is not in the candidate profile.
"""

    result = generate_openai_recruiter_response(
        candidate=candidate,
        question=question,
    )

    return {
        "candidate_id": candidate.id,
        "candidate_name": candidate.candidate_name,
        "fit_score": candidate.fit_score,
        "scorecard": result["answer"],
        "model": result["model"],
        "ai_provider": "openai",
    }