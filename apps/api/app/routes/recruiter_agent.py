from fastapi import APIRouter
from fastapi import Form
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)


router = APIRouter(
    prefix="/api/v1/recruiter-agent",
    tags=["recruiter-agent"],
)


@router.post("/candidate/{candidate_id}/run")
def run_recruiter_agent(
    candidate_id: int,
    role_context: str = Form(
        "AI/ML or full stack engineering role"
    ),
    recruiter_goal: str = Form(
        "Decide whether to advance this candidate and recommend next steps."
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
You are an autonomous recruiter agent.

Role context:
{role_context}

Recruiter goal:
{recruiter_goal}

Analyze this candidate and produce an autonomous recruiter workflow.

Return:
1. Candidate decision: advance / hold / reject
2. Confidence score from 1-100
3. Why this decision was made
4. Top matched role strengths
5. Main concerns or risk flags
6. Missing evidence to verify
7. Suggested recruiter next action
8. Interview plan with 5 targeted questions
9. Suggested outreach message to candidate
10. Hiring manager summary
11. Recommended pipeline stage
12. Final agent reasoning summary

Be specific, practical, and do not invent unsupported experience.
"""

        result = generate_openai_recruiter_response(
            candidate=candidate,
            question=question,
        )

        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.candidate_name,
            "fit_score": candidate.fit_score,
            "candidate_status": candidate.candidate_status,
            "role_context": role_context,
            "recruiter_goal": recruiter_goal,
            "agent_result": result["answer"],
            "model": result["model"],
            "ai_provider": "openai",
        }

    finally:
        db.close()