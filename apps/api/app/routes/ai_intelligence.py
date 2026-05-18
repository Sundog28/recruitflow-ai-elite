from fastapi import APIRouter
from fastapi import Form
from fastapi import Request

from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)


router = APIRouter(
    prefix="/api/v1/ai-intelligence",
    tags=["ai-intelligence"],
)


@router.post("/candidate/{candidate_id}/interview-evaluation")
@limiter.limit("20 per hour")
def evaluate_candidate_interview(
    request: Request,
    candidate_id: int,
    interview_notes: str = Form(...),
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

        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.candidate_name,
            "fit_score": candidate.fit_score,
            "interview_evaluation": result["answer"],
            "model": result["model"],
            "ai_provider": "openai",
        }

    finally:
        db.close()


@router.get("/candidate/{candidate_id}/advanced-recommendation")
@limiter.limit("30 per hour")
def generate_advanced_hiring_recommendation(
    request: Request,
    candidate_id: int,
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

        question = """
Generate an advanced hiring recommendation.

Return:
1. Hire / hold / reject decision
2. Confidence score from 1-100
3. Why this decision makes sense
4. Main strengths
5. Main hiring risks
6. Skills gap analysis
7. Interview focus plan
8. Suggested next recruiter action
9. One-paragraph hiring manager summary

Be specific, practical, and evidence-based.
"""

        result = generate_openai_recruiter_response(
            candidate=candidate,
            question=question,
        )

        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.candidate_name,
            "fit_score": candidate.fit_score,
            "advanced_recommendation": result["answer"],
            "model": result["model"],
            "ai_provider": "openai",
        }

    finally:
        db.close()


@router.post("/candidate/{candidate_id}/memory")
@limiter.limit("30 per hour")
def recruiter_memory_response(
    request: Request,
    candidate_id: int,
    recruiter_context: str = Form(...),
    question: str = Form(...),
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

        memory_prompt = f"""
You are using recruiter memory/context to answer a candidate question.

Recruiter memory/context:
{recruiter_context}

Recruiter question:
{question}

Use the candidate profile and the recruiter memory together.

Return:
1. Direct answer
2. How the recruiter context affects the answer
3. Candidate-specific evidence
4. Risks or tradeoffs
5. Recommended next action
"""

        result = generate_openai_recruiter_response(
            candidate=candidate,
            question=memory_prompt,
        )

        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.candidate_name,
            "memory_context": recruiter_context,
            "question": question,
            "answer": result["answer"],
            "model": result["model"],
            "ai_provider": "openai",
        }

    finally:
        db.close()