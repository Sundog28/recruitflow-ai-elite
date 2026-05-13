from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AnalysisRecord

router = APIRouter(prefix="/api/v1/recruiter", tags=["recruiter"])


@router.get("/dashboard")
def recruiter_dashboard(db: Session = Depends(get_db)):
    analyses = (
        db.query(AnalysisRecord)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(25)
        .all()
    )

    total_candidates = len(analyses)

    strong_matches = len(
        [a for a in analyses if a.fit_score >= 80]
    )

    interview_ready = len(
        [
            a
            for a in analyses
            if a.candidate_status == "interview"
        ]
    )

    bookmarked = len(
        [
            a
            for a in analyses
            if a.bookmarked
        ]
    )

    return {
        "total_candidates": total_candidates,
        "strong_matches": strong_matches,
        "interview_ready": interview_ready,
        "bookmarked_candidates": bookmarked,
        "recent_candidates": [
            {
                "id": a.id,
                "candidate_name": a.candidate_name,
                "fit_score": a.fit_score,
                "status": a.candidate_status,
                "bookmarked": a.bookmarked,
                "created_at": a.created_at,
            }
            for a in analyses
        ],
    }