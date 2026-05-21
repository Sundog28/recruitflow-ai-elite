from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser
from app.services.openai_recruiter_service import generate_openai_recruiter_response


router = APIRouter(
    prefix="/api/v1/candidate-similarity",
    tags=["candidate-similarity"],
)


@router.get("/candidate/{candidate_id}")
def recommend_similar_candidates(
    candidate_id: int,
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    target_candidate = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .first()
    )

    if not target_candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found.",
        )

    candidates = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .filter(AnalysisRecord.id != candidate_id)
        .order_by(AnalysisRecord.fit_score.desc())
        .limit(10)
        .all()
    )

    if not candidates:
        return {
            "candidate_id": target_candidate.id,
            "candidate_name": target_candidate.candidate_name,
            "count": 0,
            "similar_candidates": [],
            "ai_recommendation": (
                "No other recruiter-owned candidates were found to compare against."
            ),
        }

    candidate_list = ""

    for candidate in candidates:
        candidate_list += f"""
Candidate ID: {candidate.id}
Name: {candidate.candidate_name}
Fit Score: {candidate.fit_score}
Status: {candidate.candidate_status}
Matched Skills: {candidate.matched_skills}
Missing Skills: {candidate.missing_skills}
Recommendation: {candidate.hiring_recommendation}
"""

    question = f"""
You are an AI talent intelligence assistant.

Find candidates similar to the target candidate and explain why they are similar.

Target candidate:
Name: {target_candidate.candidate_name}
Fit Score: {target_candidate.fit_score}
Matched Skills: {target_candidate.matched_skills}
Missing Skills: {target_candidate.missing_skills}
Recommendation: {target_candidate.hiring_recommendation}

Available candidates:
{candidate_list}

Return:
1. Top similar candidates ranked
2. Why each candidate is similar
3. Skill overlap
4. Key differences
5. Which candidate is the best alternate
6. Recruiter next action

Be concise, practical, and evidence-based.
"""

    result = generate_openai_recruiter_response(
        candidate=target_candidate,
        question=question,
    )

    similar_candidates = []

    for candidate in candidates:
        similar_candidates.append(
            {
                "id": candidate.id,
                "candidate_name": candidate.candidate_name,
                "resume_filename": candidate.resume_filename,
                "fit_score": candidate.fit_score,
                "status": candidate.candidate_status,
                "matched_skills": candidate.matched_skills,
                "missing_skills": candidate.missing_skills,
                "hiring_recommendation": candidate.hiring_recommendation,
            }
        )

    return {
        "candidate_id": target_candidate.id,
        "candidate_name": target_candidate.candidate_name,
        "count": len(similar_candidates),
        "similar_candidates": similar_candidates,
        "ai_recommendation": result["answer"],
        "model": result["model"],
        "ai_provider": "openai",
    }