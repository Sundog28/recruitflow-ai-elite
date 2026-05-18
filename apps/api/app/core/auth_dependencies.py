from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.db.models import RecruiterUser


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_current_recruiter(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token.",
        )

    token = credentials.credentials

    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    recruiter_user_id = payload.get("recruiter_user_id")

    if not recruiter_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    recruiter = (
        db.query(RecruiterUser)
        .filter(RecruiterUser.id == recruiter_user_id)
        .first()
    )

    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Recruiter not found.",
        )

    if not recruiter.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter account is inactive.",
        )

    return recruiter