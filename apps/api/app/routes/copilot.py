from fastapi import APIRouter
from fastapi import Form
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.copilot_service import (
    generate_candidate_summary,
)

from app.services.openai_recruiter_service import (
    generate_openai_recruiter_response,
)

router = APIRouter(
    prefix="/api/v1/copilot",
    tags=["copilot"],
)


def serialize_candidate_for_copilot(
    candidate: AnalysisRecord,
):
    return {
        "id": candidate.id,
        "candidate_name": (
            candidate.candidate_name
            or "Unknown Candidate"
        ),
        "resume_filename": candidate.resume_filename,
        "fit_score": candidate.fit_score,
        "predicted_label": candidate.predicted_label,
        "semantic_similarity": candidate.semantic_similarity,
        "matched_skills": candidate.matched_skills,
        "missing_skills": candidate.missing_skills,
        "strengths": candidate.strengths,
        "red_flags": candidate.red_flags,
        "recommendations": candidate.recommendations,
        "hiring_recommendation": (
            candidate.hiring_recommendation
        ),
        "score_explanation": (
            candidate.score_explanation
        ),
        "ats_score": candidate.ats_score,
        "skill_score": candidate.skill_score,
        "experience_score": (
            candidate.experience_score
        ),
        "project_relevance_score": (
            candidate.project_relevance_score
        ),
        "seniority_match_score": (
            candidate.seniority_match_score
        ),
        "recruiter_notes": (
            candidate.recruiter_notes
        ),
        "candidate_status": (
            candidate.candidate_status
        ),
    }


@router.get("/candidate/{candidate_id}")
def candidate_copilot(
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

        return generate_candidate_summary(
            candidate
        )

    finally:
        db.close()


@router.post(
    "/candidate/{candidate_id}/chat"
)
def candidate_copilot_chat(
    candidate_id: int,
    question: str = Form(...),
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

        candidate_data = (
            serialize_candidate_for_copilot(
                candidate
            )
        )

        try:
            openai_response = (
                generate_openai_recruiter_response(
                    candidate,
                    question,
                )
            )

            return {
                "candidate_id": candidate_id,
                "question": question,
                "answer": openai_response[
                    "answer"
                ],
                "model": openai_response[
                    "model"
                ],
                "ai_provider": "openai",
                "candidate": candidate_data,
            }

        except Exception as openai_error:
            print(
                "OPENAI FALLBACK:",
                str(openai_error),
            )

        lower_question = question.lower()

        if "interview" in lower_question:
            answer = (
                f"Yes, {candidate_data['candidate_name']} appears worth interviewing "
                f"if the role matches their strongest skills. Their fit score is "
                f"{candidate_data['fit_score']} and their recommendation is "
                f"{candidate_data['hiring_recommendation'] or 'not specified'}."
            )

        elif (
            "weak" in lower_question
            or "risk" in lower_question
        ):
            answer = (
                f"The main risks for {candidate_data['candidate_name']} are tied to "
                f"missing skills and red flags. Missing skills: "
                f"{candidate_data['missing_skills'] or 'none listed'}. Red flags: "
                f"{candidate_data['red_flags'] or 'none listed'}."
            )

        elif "strength" in lower_question:
            answer = (
                f"{candidate_data['candidate_name']}'s biggest strengths are: "
                f"{candidate_data['strengths'] or 'no strengths listed'}. "
                f"Their matched skills are: "
                f"{candidate_data['matched_skills'] or 'none listed'}."
            )

        elif "question" in lower_question:
            answer = (
                "Suggested interview questions:\n"
                "1. Can you walk me through the most relevant project on your resume?\n"
                "2. Which listed skill have you used most recently in production or project work?\n"
                "3. How would you approach the responsibilities in this job description?\n"
                "4. Can you explain a technical challenge you solved?\n"
                "5. What areas would you need to ramp up on for this role?"
            )

        elif "hire" in lower_question:
            answer = (
                f"Based on the current analysis, the hiring recommendation is: "
                f"{candidate_data['hiring_recommendation'] or 'not specified'}. "
                f"The candidate has a fit score of {candidate_data['fit_score']} "
                f"with predicted label '{candidate_data['predicted_label']}'."
            )

        else:
            answer = (
                f"{candidate_data['candidate_name']} has a fit score of "
                f"{candidate_data['fit_score']} and is currently labeled as "
                f"'{candidate_data['predicted_label']}'. Matched skills: "
                f"{candidate_data['matched_skills'] or 'none listed'}. "
                f"Missing skills: {candidate_data['missing_skills'] or 'none listed'}."
            )

        return {
            "candidate_id": candidate_id,
            "question": question,
            "answer": answer,
            "model": "fallback-local",
            "ai_provider": "local",
            "candidate": candidate_data,
        }

    finally:
        db.close()