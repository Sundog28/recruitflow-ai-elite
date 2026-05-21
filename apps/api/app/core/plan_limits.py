from fastapi import HTTPException
from app.db.models import RecruiterUser


FREE_ANALYSIS_LIMIT = 3


def is_paid_recruiter(recruiter: RecruiterUser) -> bool:
    return (
        recruiter.plan_name in ["pro", "growth", "business", "enterprise"]
        and recruiter.subscription_status in ["active", "trialing"]
    )


def require_paid_plan(recruiter: RecruiterUser):
    if is_paid_recruiter(recruiter):
        return

    raise HTTPException(
        status_code=403,
        detail="This feature requires RecruitFlow Pro.",
    )


def enforce_free_analysis_limit(recruiter: RecruiterUser):
    if is_paid_recruiter(recruiter):
        return

    if (recruiter.analysis_count or 0) >= FREE_ANALYSIS_LIMIT:
        raise HTTPException(
            status_code=403,
            detail="Free trial limit reached. Upgrade to RecruitFlow Pro.",
        )