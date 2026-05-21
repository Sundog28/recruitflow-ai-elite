import os

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/stripe-checkout",
    tags=["stripe-checkout"],
)


STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")

FRONTEND_SUCCESS_URL = os.getenv(
    "FRONTEND_SUCCESS_URL",
    "https://recruitflow-ai-elite.vercel.app?checkout=success",
)

FRONTEND_CANCEL_URL = os.getenv(
    "FRONTEND_CANCEL_URL",
    "https://recruitflow-ai-elite.vercel.app?checkout=cancelled",
)


@router.post("/create-session")
def create_checkout_session(
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe secret key is not configured.",
        )

    if not STRIPE_PRICE_ID_PRO:
        raise HTTPException(
            status_code=500,
            detail="Stripe Pro price ID is not configured.",
        )

    try:
        import stripe

        stripe.api_key = STRIPE_SECRET_KEY

        customer_email = recruiter.email

        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            customer_email=customer_email,
            line_items=[
                {
                    "price": STRIPE_PRICE_ID_PRO,
                    "quantity": 1,
                }
            ],
            success_url=FRONTEND_SUCCESS_URL,
            cancel_url=FRONTEND_CANCEL_URL,
            metadata={
                "recruiter_id": str(recruiter.id),
                "recruiter_email": recruiter.email,
                "plan_name": "pro",
            },
        )

        recruiter.stripe_customer_id = session.customer
        recruiter.subscription_status = (
            recruiter.subscription_status or "checkout_started"
        )

        db.commit()

        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "plan_name": "pro",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe checkout failed: {str(exc)}",
        )