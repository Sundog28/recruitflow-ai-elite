import os

from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Request

import stripe

from app.db.database import SessionLocal
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/stripe-webhooks",
    tags=["stripe-webhooks"],
)


STRIPE_SECRET_KEY = os.getenv(
    "STRIPE_SECRET_KEY"
)

STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET"
)

stripe.api_key = STRIPE_SECRET_KEY


def update_recruiter_subscription(
    customer_email: str,
    customer_id: str,
    subscription_id: str,
    status: str,
    plan_name: str = "pro",
):
    db = SessionLocal()

    try:
        recruiter = (
            db.query(RecruiterUser)
            .filter(
                RecruiterUser.email
                == customer_email
            )
            .first()
        )

        if not recruiter:
            return

        recruiter.plan = plan_name
        recruiter.plan_name = plan_name

        recruiter.subscription_status = (
            status
        )

        recruiter.stripe_customer_id = (
            customer_id
        )

        recruiter.stripe_subscription_id = (
            subscription_id
        )

        db.commit()

    finally:
        db.close()


@router.post("/")
async def stripe_webhook(
    request: Request,
):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail=(
                "Stripe webhook secret "
                "not configured."
            ),
        )

    payload = await request.body()

    sig_header = request.headers.get(
        "stripe-signature"
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

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    event_type = event["type"]

    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        customer_email = data.get(
            "customer_email"
        )

        customer_id = data.get(
            "customer"
        )

        subscription_id = data.get(
            "subscription"
        )

        update_recruiter_subscription(
            customer_email=customer_email,
            customer_id=customer_id,
            subscription_id=subscription_id,
            status="active",
            plan_name="pro",
        )

    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")

        db = SessionLocal()

        try:
            recruiter = (
                db.query(RecruiterUser)
                .filter(
                    RecruiterUser.stripe_customer_id
                    == customer_id
                )
                .first()
            )

            if recruiter:
                recruiter.plan = "free"

                recruiter.plan_name = (
                    "free"
                )

                recruiter.subscription_status = (
                    "cancelled"
                )

                db.commit()

        finally:
            db.close()

    elif (
        event_type
        == "invoice.payment_failed"
    ):
        customer_id = data.get("customer")

        db = SessionLocal()

        try:
            recruiter = (
                db.query(RecruiterUser)
                .filter(
                    RecruiterUser.stripe_customer_id
                    == customer_id
                )
                .first()
            )

            if recruiter:
                recruiter.subscription_status = (
                    "past_due"
                )

                db.commit()

        finally:
            db.close()

    return {
        "received": True,
        "event_type": event_type,
    }