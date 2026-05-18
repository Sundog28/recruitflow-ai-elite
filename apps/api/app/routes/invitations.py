import secrets
from datetime import datetime

from fastapi import APIRouter
from fastapi import Form
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import RecruiterInvitation
from app.db.models import RecruiterTeam
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/invitations",
    tags=["invitations"],
)


@router.post("/create")
def create_invitation(
    email: str = Form(...),
    team_id: int = Form(...),
    role: str = Form("recruiter"),
    invited_by_user_id: int = Form(...),
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

        token = secrets.token_urlsafe(32)

        invitation = RecruiterInvitation(
            email=email,
            invited_by_user_id=invited_by_user_id,
            team_id=team_id,
            role=role,
            invitation_token=token,
        )

        db.add(invitation)
        db.commit()
        db.refresh(invitation)

        return {
            "message": "Invitation created.",
            "invitation": {
                "id": invitation.id,
                "email": invitation.email,
                "team_id": invitation.team_id,
                "role": invitation.role,
                "status": invitation.status,
                "invitation_token": invitation.invitation_token,
            },
        }

    finally:
        db.close()


@router.post("/accept")
def accept_invitation(
    invitation_token: str = Form(...),
    recruiter_user_id: int = Form(...),
):
    db: Session = SessionLocal()

    try:
        invitation = (
            db.query(RecruiterInvitation)
            .filter(
                RecruiterInvitation.invitation_token
                == invitation_token
            )
            .first()
        )

        if not invitation:
            return {
                "detail": "Invitation not found.",
            }

        if invitation.status == "accepted":
            return {
                "detail": "Invitation already accepted.",
            }

        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.id == recruiter_user_id)
            .first()
        )

        if not recruiter:
            return {
                "detail": "Recruiter user not found.",
            }

        recruiter.team_id = invitation.team_id
        recruiter.role = invitation.role

        invitation.status = "accepted"
        invitation.accepted_at = datetime.utcnow()

        db.commit()

        return {
            "message": "Invitation accepted.",
            "team_id": recruiter.team_id,
            "role": recruiter.role,
        }

    finally:
        db.close()


@router.get("/team/{team_id}")
def list_team_invitations(team_id: int):
    db: Session = SessionLocal()

    try:
        invitations = (
            db.query(RecruiterInvitation)
            .filter(RecruiterInvitation.team_id == team_id)
            .all()
        )

        return {
            "team_id": team_id,
            "count": len(invitations),
            "invitations": [
                {
                    "id": invitation.id,
                    "email": invitation.email,
                    "role": invitation.role,
                    "status": invitation.status,
                    "created_at": invitation.created_at,
                    "accepted_at": invitation.accepted_at,
                }
                for invitation in invitations
            ],
        }

    finally:
        db.close()