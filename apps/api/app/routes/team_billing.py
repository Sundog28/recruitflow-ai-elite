from fastapi import APIRouter
from fastapi import Form
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import RecruiterTeam


router = APIRouter(
    prefix="/api/v1/team-billing",
    tags=["team-billing"],
)


TEAM_PLANS = {
    "free": {
        "plan_name": "free",
        "seat_limit": 1,
        "monthly_price": 0.0,
    },
    "growth": {
        "plan_name": "growth",
        "seat_limit": 5,
        "monthly_price": 199.0,
    },
    "business": {
        "plan_name": "business",
        "seat_limit": 15,
        "monthly_price": 499.0,
    },
    "enterprise": {
        "plan_name": "enterprise",
        "seat_limit": 100,
        "monthly_price": 999.0,
    },
}


def serialize_team_billing(team: RecruiterTeam):
    return {
        "team_id": team.id,
        "team_name": team.team_name,
        "plan_name": team.plan_name or "free",
        "subscription_status": team.subscription_status or "free",
        "stripe_customer_id": team.stripe_customer_id,
        "stripe_subscription_id": team.stripe_subscription_id,
        "seat_count": team.seat_count or 1,
        "seat_limit": team.seat_limit or 1,
        "monthly_price": team.monthly_price or 0.0,
    }


@router.get("/team/{team_id}")
def get_team_billing(team_id: int):
    db: Session = SessionLocal()

    try:
        team = (
            db.query(RecruiterTeam)
            .filter(RecruiterTeam.id == team_id)
            .first()
        )

        if not team:
            return {
                "detail": "Team not found.",
            }

        return serialize_team_billing(team)

    finally:
        db.close()


@router.patch("/team/{team_id}/plan")
def update_team_plan(
    team_id: int,
    plan_name: str = Form(...),
):
    db: Session = SessionLocal()

    try:
        team = (
            db.query(RecruiterTeam)
            .filter(RecruiterTeam.id == team_id)
            .first()
        )

        if not team:
            return {
                "detail": "Team not found.",
            }

        if plan_name not in TEAM_PLANS:
            return {
                "detail": "Invalid team plan.",
                "valid_plans": list(TEAM_PLANS.keys()),
            }

        selected_plan = TEAM_PLANS[plan_name]

        team.plan_name = selected_plan["plan_name"]
        team.subscription_status = (
            "active" if plan_name != "free" else "free"
        )
        team.seat_limit = selected_plan["seat_limit"]
        team.monthly_price = selected_plan["monthly_price"]

        db.commit()
        db.refresh(team)

        return {
            "message": "Team plan updated.",
            "billing": serialize_team_billing(team),
        }

    finally:
        db.close()


@router.patch("/team/{team_id}/seats")
def update_team_seats(
    team_id: int,
    seat_count: int = Form(...),
):
    db: Session = SessionLocal()

    try:
        team = (
            db.query(RecruiterTeam)
            .filter(RecruiterTeam.id == team_id)
            .first()
        )

        if not team:
            return {
                "detail": "Team not found.",
            }

        if seat_count < 1:
            return {
                "detail": "Seat count must be at least 1.",
            }

        if seat_count > (team.seat_limit or 1):
            return {
                "detail": "Seat count exceeds current plan seat limit.",
                "seat_limit": team.seat_limit,
            }

        team.seat_count = seat_count

        db.commit()
        db.refresh(team)

        return {
            "message": "Team seat count updated.",
            "billing": serialize_team_billing(team),
        }

    finally:
        db.close()


@router.get("/plans")
def list_team_plans():
    return {
        "plans": TEAM_PLANS,
    }