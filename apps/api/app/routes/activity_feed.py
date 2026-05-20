from fastapi import APIRouter
from fastapi import Depends
from fastapi import Header
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser

from app.core.security import decode_access_token

router = APIRouter(
    prefix="/api/v1/activity",
    tags=["activity"],
)


def get_current_recruiter(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header.",
        )

    try:
        token = authorization.replace(
            "Bearer ",
            "",
        )

        payload = decode_access_token(token)

        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token.",
            )

        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.email == email)
            .first()
        )

        if not recruiter:
            raise HTTPException(
                status_code=401,
                detail="Recruiter not found.",
            )

        return recruiter

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )


@router.get("/feed")
def get_activity_feed(
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(
        get_current_recruiter
    ),
):
    records = (
        db.query(AnalysisRecord)
        .filter(
            AnalysisRecord.recruiter_user_id
            == recruiter.id
        )
        .order_by(AnalysisRecord.created_at.desc())
        .limit(25)
        .all()
    )

    feed = []

    for record in records:
        feed.append(
            {
                "id": record.id,
                "candidate_name": record.candidate_name,
                "fit_score": record.fit_score,
                "status": record.status,
                "created_at": record.created_at,
                "event_type": "candidate_analysis",
                "message": (
                    f"{record.candidate_name or 'Candidate'} "
                    f"was analyzed with a "
                    f"{record.fit_score}% fit score."
                ),
            }
        )

        if record.bookmarked:
            feed.append(
                {
                    "id": f"bookmark-{record.id}",
                    "candidate_name": record.candidate_name,
                    "fit_score": record.fit_score,
                    "status": record.status,
                    "created_at": record.created_at,
                    "event_type": "candidate_bookmarked",
                    "message": (
                        f"{record.candidate_name or 'Candidate'} "
                        f"was bookmarked by recruiter."
                    ),
                }
            )

    return {
        "count": len(feed),
        "activities": feed,
    }