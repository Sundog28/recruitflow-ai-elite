import os
import stripe

from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Request

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import RecruiterUser

router = APIRouter(
    prefix="/api/v1/billing",
    tags=["billing"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PRICE_ID = os.getenv("STRIPE_PRICE_ID")

STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET"
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://recruitflow-ai-elite.vercel.app",
)


@router.post("/create-checkout-session")
def create_checkout_session():
    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Missing STRIPE_SECRET_KEY.",
        )

    if not PRICE_ID:
        raise HTTPException(
            status_code=500,
            detail="Missing STRIPE_PRICE_ID.",
        )

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",

            line_items=[
                {
                    "price": PRICE_ID,
                    "quantity": 1,
                }
            ],

            success_url=f"{FRONTEND_URL}/?checkout=success",

            cancel_url=f"{FRONTEND_URL}/?checkout=cancelled",
        )

        return {
            "checkout_url": session.url
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):

    payload = await request.body()

    sig_header = request.headers.get(
        "stripe-signature"
    )

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Missing STRIPE_WEBHOOK_SECRET",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            STRIPE_WEBHOOK_SECRET,
        )

    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=400,
            detail="Invalid Stripe signature.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    db: Session = SessionLocal()

    try:

        if event["type"] == "checkout.session.completed":

            session = event["data"]["object"]

            customer_id = session.get("customer")

            subscription_id = session.get(
                "subscription"
            )

            recruiter = (
                db.query(RecruiterUser)
                .filter(RecruiterUser.id == 1)
                .first()
            )

            if recruiter:

                recruiter.subscription_status = "active"

                recruiter.plan_name = "pro"

                recruiter.stripe_customer_id = (
                    customer_id
                )

                recruiter.stripe_subscription_id = (
                    subscription_id
                )

                recruiter.plan = "pro"

                db.commit()

        if event["type"] == "customer.subscription.deleted":

            subscription = event["data"]["object"]

            subscription_id = subscription.get("id")

            recruiter = (
                db.query(RecruiterUser)
                .filter(
                    RecruiterUser.stripe_subscription_id
                    == subscription_id
                )
                .first()
            )

            if recruiter:

                recruiter.subscription_status = (
                    "cancelled"
                )

                recruiter.plan_name = "free"

                recruiter.plan = "free"

                db.commit()

        return {
            "status": "success"
        }

    finally:
        db.close()