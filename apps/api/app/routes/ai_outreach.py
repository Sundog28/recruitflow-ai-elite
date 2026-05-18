from fastapi import APIRouter
from fastapi import Form
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)


router = APIRouter(
    prefix="/api/v1/ai-outreach",
    tags=["ai-outreach"],
)


@router.post("/candidate/{candidate_id}/generate")
def generate_candidate_outreach(
    candidate_id: int,
    outreach_type: str = Form(
        "initial_outreach"
    ),
    recruiter_tone: str = Form(
        "professional and friendly"
    ),
):
    db: Session = SessionLocal()

    try:
        candidate = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not candidate:
            return {
                "detail": "Candidate not found.",
            }

        question = f"""
You are an expert recruiter communication assistant.

Generate a recruiter message for this candidate.

Outreach type:
{outreach_type}

Recruiter tone:
{recruiter_tone}

Possible outreach types:
- initial_outreach
- interview_invitation
- follow_up
- rejection
- hiring_manager_update
- passive_candidate_outreach

Return:
1. Subject line
2. Full recruiter message
3. Why this message works
4. Suggested recruiter next action

Keep messages realistic, concise, and professional.
"""

        result = generate_openai_recruiter_response(
            candidate=candidate,
            question=question,
        )

        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.candidate_name,
            "outreach_type": outreach_type,
            "recruiter_tone": recruiter_tone,
            "message": result["answer"],
            "model": result["model"],
            "ai_provider": "openai",
        }

    finally:
        db.close()