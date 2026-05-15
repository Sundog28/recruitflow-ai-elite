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
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

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
            subscription_data={
                "trial_period_days": 7,
            },
            success_url=f"{FRONTEND_URL}/?checkout=success",
            cancel_url=f"{FRONTEND_URL}/?checkout=cancelled",
        )

        return {
            "checkout_url": session.url,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Missing STRIPE_WEBHOOK_SECRET.",
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
            subscription_id = session.get("subscription")

            customer_email = (
                session.get("customer_details", {}) or {}
            ).get("email")

            recruiter = None

            if customer_email:
                recruiter = (
                    db.query(RecruiterUser)
                    .filter(RecruiterUser.email == customer_email)
                    .first()
                )

            if not recruiter:
                recruiter = (
                    db.query(RecruiterUser)
                    .filter(RecruiterUser.id == 1)
                    .first()
                )

            if recruiter:
                subscription = stripe.Subscription.retrieve(
                    subscription_id
                )

                status = subscription.get("status")

                recruiter.subscription_status = status
                recruiter.plan_name = "pro"
                recruiter.plan = "pro"
                recruiter.stripe_customer_id = customer_id
                recruiter.stripe_subscription_id = subscription_id

                db.commit()

        elif event["type"] == "customer.subscription.deleted":
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
                recruiter.subscription_status = "cancelled"
                recruiter.plan_name = "free"
                recruiter.plan = "free"

                db.commit()

        return {
            "status": "success",
        }

    finally:
        db.close()

@router.post("/create-customer-portal")
def create_customer_portal():

    db: Session = SessionLocal()

    try:

        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.id == 1)
            .first()
        )

        if not recruiter:
            raise HTTPException(
                status_code=404,
                detail="Recruiter not found.",
            )

        if not recruiter.stripe_customer_id:
            raise HTTPException(
                status_code=400,
                detail="No Stripe customer found.",
            )

        portal_session = stripe.billing_portal.Session.create(
            customer=recruiter.stripe_customer_id,

            return_url=FRONTEND_URL,
        )

        return {
            "portal_url": portal_session.url,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        db.close()