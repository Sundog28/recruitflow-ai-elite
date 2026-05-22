import os

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

import stripe

from app.core.auth_dependencies import get_current_recruiter
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/stripe-billing-portal",
    tags=["stripe-billing-portal"],
)


STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

FRONTEND_BILLING_RETURN_URL = os.getenv(
    "FRONTEND_BILLING_RETURN_URL",
    "https://recruitflow-ai-elite.vercel.app",
)

stripe.api_key = STRIPE_SECRET_KEY


@router.post("/create-session")
def create_billing_portal_session(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe secret key is not configured.",
        )

    if not recruiter.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No Stripe customer found for this recruiter.",
        )

    try:
        session = stripe.billing_portal.Session.create(
            customer=recruiter.stripe_customer_id,
            return_url=FRONTEND_BILLING_RETURN_URL,
        )

        return {
            "portal_url": session.url,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe billing portal failed: {str(exc)}",
        )