from fastapi import APIRouter
from fastapi import Form
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import RecruiterTeam
from app.db.models import RecruiterUser

router = APIRouter(
    prefix="/api/v1/team",
    tags=["team"]
)

@router.post("/create")
def create_team(
    team_name: str = Form(...),
    owner_email: str = Form(...)
):
    db: Session = SessionLocal()

    try:

        owner = (
            db.query(RecruiterUser)
            .filter(
                RecruiterUser.email == owner_email
            )
            .first()
        )

        if not owner:
            return {
                "detail": "Owner not found."
            }

        team = RecruiterTeam(
            team_name=team_name,
            owner_id=owner.id
        )

        db.add(team)
        db.commit()
        db.refresh(team)

        owner.team_id = team.id
        owner.role = "admin"

        db.commit()

        return {
            "message": "Team created.",
            "team_id": team.id,
            "team_name": team.team_name,
        }

    finally:
        db.close()