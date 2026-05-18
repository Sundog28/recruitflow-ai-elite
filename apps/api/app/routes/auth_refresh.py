from fastapi import APIRouter
from fastapi import Form

from app.core.security import create_access_token
from app.core.security import decode_token


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


@router.post("/refresh")
def refresh_access_token(
    refresh_token: str = Form(...),
):
    try:
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            return {
                "detail": "Invalid refresh token.",
            }

        recruiter_user_id = payload.get(
            "recruiter_user_id"
        )

        access_token = create_access_token(
            {
                "recruiter_user_id": recruiter_user_id,
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except Exception:
        return {
            "detail": "Refresh token expired or invalid.",
        }