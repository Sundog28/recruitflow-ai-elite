from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser

router = APIRouter(
    prefix="/api/v1/hiring-packets",
    tags=["hiring-packets"],
)


@router.get("/candidate/{candidate_id}")
def generate_hiring_packet(
    candidate_id: int,
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(
        get_current_recruiter
    ),
):
    candidate = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id)
        .filter(
            AnalysisRecord.recruiter_id
            == recruiter.id
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found.",
        )

    packet = {
        "candidate": {
            "id": candidate.id,
            "candidate_name": candidate.candidate_name,
            "resume_filename": candidate.resume_filename,
            "fit_score": candidate.fit_score,
            "predicted_label": candidate.predicted_label,
            "semantic_similarity": candidate.semantic_similarity,
            "confidence_score": candidate.confidence_score,
            "candidate_status": candidate.candidate_status,
            "hiring_recommendation": (
                candidate.hiring_recommendation
            ),
        },
        "skills": {
            "matched_skills": (
                candidate.matched_skills
            ),
            "missing_skills": (
                candidate.missing_skills
            ),
            "category_scores": (
                candidate.category_scores
            ),
        },
        "analytics": {
            "ats_score": candidate.ats_score,
            "skill_score": (
                candidate.skill_score
            ),
            "experience_score": (
                candidate.experience_score
            ),
            "project_relevance_score": (
                candidate.project_relevance_score
            ),
            "seniority_match_score": (
                candidate.seniority_match_score
            ),
        },
        "recruiter_review": {
            "strengths": candidate.strengths,
            "recommendations": (
                candidate.recommendations
            ),
            "red_flags": candidate.red_flags,
            "score_explanation": (
                candidate.score_explanation
            ),
        },
        "generated_by": {
            "platform": "RecruitFlow AI Elite",
            "recruiter_email": recruiter.email,
        },
    }

    return {
        "message": (
            "Hiring packet generated successfully."
        ),
        "packet": packet,
    }