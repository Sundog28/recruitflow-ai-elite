from fastapi import APIRouter
from fastapi import Depends
from fastapi import Form
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.database import get_db
from app.db.models import RecruiterUser
from app.services.auth_service import create_access_token
from app.services.auth_service import hash_password
from app.services.auth_service import verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def serialize_user(user: RecruiterUser):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "company_name": user.company_name,
        "plan": getattr(user, "plan", "free") or "free",
        "plan_name": getattr(user, "plan_name", "free") or "free",
        "subscription_status": getattr(user, "subscription_status", "free") or "free",
        "analysis_count": getattr(user, "analysis_count", 0) or 0,
    }


@router.post("/signup")
def signup(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(""),
    company_name: str = Form(""),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(RecruiterUser)
        .filter(RecruiterUser.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered.",
        )

    user = RecruiterUser(
        email=email,
        full_name=full_name,
        company_name=company_name,
        hashed_password=hash_password(password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})

    return {
        "message": "Recruiter account created.",
        "access_token": token,
        "user": serialize_user(user),
    }


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = (
        db.query(RecruiterUser)
        .filter(RecruiterUser.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials.",
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials.",
        )

    token = create_access_token({"sub": user.email})

    return {
        "access_token": token,
        "user": serialize_user(user),
    }


@router.get("/me/{recruiter_id}")
def get_current_recruiter_status(recruiter_id: int):
    db = SessionLocal()

    try:
        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.id == recruiter_id)
            .first()
        )

        if not recruiter:
            raise HTTPException(
                status_code=404,
                detail="Recruiter not found.",
            )

        return serialize_user(recruiter)

    finally:
        db.close()


@router.patch("/me/{recruiter_id}/dev-upgrade")
def dev_upgrade_recruiter(recruiter_id: int):
    db = SessionLocal()

    try:
        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.id == recruiter_id)
            .first()
        )

        if not recruiter:
            raise HTTPException(
                status_code=404,
                detail="Recruiter not found.",
            )

        recruiter.subscription_status = "trialing"
        recruiter.plan_name = "pro"
        recruiter.plan = "pro"

        db.commit()
        db.refresh(recruiter)

        return {
            "message": "Recruiter upgraded for testing.",
            "user": serialize_user(recruiter),
        }

    finally:
        db.close()