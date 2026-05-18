from fastapi import APIRouter
from fastapi import Depends

from app.core.auth_dependencies import get_current_recruiter
from app.db.models import RecruiterUser
from app.routes.auth import serialize_user


router = APIRouter(
    prefix="/api/v1/session",
    tags=["session"],
)


@router.get("/me")
def get_current_session(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    return {
        "authenticated": True,
        "user": serialize_user(recruiter),
    }