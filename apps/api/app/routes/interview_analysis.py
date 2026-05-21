from fastapi import APIRouter
from fastapi import Depends
from fastapi import Form
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser
from app.services.openai_recruiter_service import generate_openai_recruiter_response

router = APIRouter(
    prefix="/api/v1/interview-analysis",
    tags=["interview-analysis"],
)


@router.post("/candidate/{candidate_id}")
def analyze_interview_transcript(
    candidate_id: int,
    transcript: str = Form(...),
    role_context: str = Form("Software engineering role"),
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
        raise HTTPException(
            status_code=404,
            detail="Candidate not found.",
        )

    question = f"""
You are an expert technical recruiter and interview evaluator.

Role context:
{role_context}

Interview transcript or notes:
{transcript}

Evaluate this candidate using the resume analysis profile and interview notes.

Return:
1. Overall interview score from 1-100
2. Technical depth score from 1-100
3. Communication score from 1-100
4. Role alignment score from 1-100
5. Evidence of strengths
6. Weak signals or concerns
7. Missing evidence
8. Follow-up questions
9. Advance / hold / reject recommendation
10. Hiring manager summary

Be specific, practical, and evidence-based.
Do not invent details not supported by the transcript or candidate profile.
"""

    result = generate_openai_recruiter_response(
        candidate=candidate,
        question=question,
    )

    return {
        "candidate_id": candidate.id,
        "candidate_name": candidate.candidate_name,
        "fit_score": candidate.fit_score,
        "role_context": role_context,
        "interview_analysis": result["answer"],
        "model": result["model"],
        "ai_provider": "openai",
    }