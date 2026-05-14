import os
import stripe

from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/api/v1/billing",
    tags=["billing"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PRICE_ID = os.getenv("STRIPE_PRICE_ID")
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://recruitflow-ai-elite.vercel.app",
)


@router.post("/create-checkout-session")
def create_checkout_session():
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY.")

    if not PRICE_ID:
        raise HTTPException(status_code=500, detail="Missing STRIPE_PRICE_ID.")

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

        return {"checkout_url": session.url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))