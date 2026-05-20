from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)

router = APIRouter(
    prefix="/api/v1/comparison",
    tags=["comparison"],
)


@router.post("/compare")
def compare_candidates(
    candidate_id_1: int,
    candidate_id_2: int,
    role_context: str,
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(
        get_current_recruiter
    ),
):
    candidate_1 = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id_1)
        .filter(
            AnalysisRecord.recruiter_id
            == recruiter.id
        )
        .first()
    )

    candidate_2 = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id_2)
        .filter(
            AnalysisRecord.recruiter_id
            == recruiter.id
        )
        .first()
    )

    if not candidate_1 or not candidate_2:
        raise HTTPException(
            status_code=404,
            detail="One or more candidates not found.",
        )

    comparison_prompt = f"""
You are an elite AI recruiting strategist.

Compare these two candidates for this role:

ROLE:
{role_context}

CANDIDATE 1:
Name: {candidate_1.candidate_name}
Fit Score: {candidate_1.fit_score}
Skills: {candidate_1.matched_skills}
Recommendations: {candidate_1.recommendations}

CANDIDATE 2:
Name: {candidate_2.candidate_name}
Fit Score: {candidate_2.fit_score}
Skills: {candidate_2.matched_skills}
Recommendations: {candidate_2.recommendations}

Return:
1. Which candidate is stronger overall
2. Technical comparison
3. Experience comparison
4. Risk comparison
5. Which candidate should advance
6. Which candidate has higher upside
7. Hiring recommendation
8. Executive recruiter summary

Be concise, strategic, and evidence-based.
"""

    result = generate_openai_recruiter_response(
        candidate=candidate_1,
        question=comparison_prompt,
    )

    return {
        "candidate_1": {
            "id": candidate_1.id,
            "name": candidate_1.candidate_name,
            "fit_score": candidate_1.fit_score,
        },
        "candidate_2": {
            "id": candidate_2.id,
            "name": candidate_2.candidate_name,
            "fit_score": candidate_2.fit_score,
        },
        "comparison": result["answer"],
        "model": result["model"],
        "ai_provider": "openai",
    }