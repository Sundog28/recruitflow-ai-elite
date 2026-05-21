from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.core.plan_limits import require_paid_plan
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser
from app.services.openai_recruiter_service import generate_openai_recruiter_response

router = APIRouter(
    prefix="/api/v1/executive-analytics",
    tags=["executive-analytics"],
)

require_paid_plan(recruiter)

@router.get("/summary")
def get_executive_analytics_summary(
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    candidates = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(100)
        .all()
    )

    total_candidates = len(candidates)

    if total_candidates == 0:
        return {
            "total_candidates": 0,
            "average_fit_score": 0,
            "strong_matches": 0,
            "potential_matches": 0,
            "weak_matches": 0,
            "bookmarked_candidates": 0,
            "pipeline": {},
            "ai_summary": "No candidate analytics are available yet.",
        }

    fit_scores = [
        candidate.fit_score or 0
        for candidate in candidates
    ]

    average_fit_score = round(
        sum(fit_scores) / total_candidates,
        2,
    )

    strong_matches = len(
        [
            candidate
            for candidate in candidates
            if (candidate.fit_score or 0) >= 80
        ]
    )

    potential_matches = len(
        [
            candidate
            for candidate in candidates
            if 60 <= (candidate.fit_score or 0) < 80
        ]
    )

    weak_matches = len(
        [
            candidate
            for candidate in candidates
            if (candidate.fit_score or 0) < 60
        ]
    )

    bookmarked_candidates = len(
        [
            candidate
            for candidate in candidates
            if candidate.bookmarked
        ]
    )

    pipeline = {}

    for candidate in candidates:
        status = (
            candidate.candidate_status
            or "screening"
        )

        pipeline[status] = pipeline.get(status, 0) + 1

    candidate_summary = ""

    for candidate in candidates[:20]:
        candidate_summary += f"""
Candidate: {candidate.candidate_name}
Fit Score: {candidate.fit_score}
Status: {candidate.candidate_status}
Recommendation: {candidate.hiring_recommendation}
Matched Skills: {candidate.matched_skills}
Red Flags: {candidate.red_flags}
"""

    question = f"""
You are an executive recruiting analytics assistant.

Summarize this recruiter's hiring pipeline.

Analytics:
Total candidates: {total_candidates}
Average fit score: {average_fit_score}
Strong matches: {strong_matches}
Potential matches: {potential_matches}
Weak matches: {weak_matches}
Bookmarked candidates: {bookmarked_candidates}
Pipeline counts: {pipeline}

Candidate sample:
{candidate_summary}

Return:
1. Executive hiring summary
2. Pipeline health
3. Candidate quality assessment
4. Recruiter priorities
5. Risks in the current pipeline
6. Recommended next actions
7. One concise leadership summary paragraph

Be concise, strategic, and executive-ready.
"""

    result = generate_openai_recruiter_response(
        candidate=candidates[0],
        question=question,
    )

    return {
        "total_candidates": total_candidates,
        "average_fit_score": average_fit_score,
        "strong_matches": strong_matches,
        "potential_matches": potential_matches,
        "weak_matches": weak_matches,
        "bookmarked_candidates": bookmarked_candidates,
        "pipeline": pipeline,
        "ai_summary": result["answer"],
        "model": result["model"],
        "ai_provider": "openai",
    }