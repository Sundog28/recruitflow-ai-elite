from fastapi import APIRouter
from fastapi import Depends

from app.core.auth_dependencies import get_current_recruiter
from app.core.plan_limits import FREE_ANALYSIS_LIMIT
from app.core.plan_limits import is_paid_recruiter
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/billing-status",
    tags=["billing-status"],
)


@router.get("/me")
def get_billing_status(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    analyses_used = recruiter.analysis_count or 0
    paid_access = is_paid_recruiter(recruiter)

    remaining_free_analyses = max(
        0,
        FREE_ANALYSIS_LIMIT - analyses_used,
    )

    return {
        "recruiter_id": recruiter.id,
        "email": recruiter.email,
        "plan": recruiter.plan or "free",
        "plan_name": recruiter.plan_name or "free",
        "subscription_status": recruiter.subscription_status or "free",
        "stripe_customer_id": recruiter.stripe_customer_id,
        "stripe_subscription_id": recruiter.stripe_subscription_id,
        "analyses_used": analyses_used,
        "free_analysis_limit": FREE_ANALYSIS_LIMIT,
        "remaining_free_analyses": (
            remaining_free_analyses
            if not paid_access
            else None
        ),
        "paid_access": paid_access,
        "features": {
            "resume_analysis": True,
            "ai_scorecards": paid_access,
            "candidate_comparison": paid_access,
            "interview_analysis": paid_access,
            "candidate_similarity": paid_access,
            "executive_analytics": paid_access,
            "semantic_discovery": paid_access,
            "ai_recruiter_copilot": paid_access,
            "shortlists": paid_access,
            "team_collaboration": paid_access,
        },
    }