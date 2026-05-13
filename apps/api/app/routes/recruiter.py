from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

router = APIRouter(
    prefix="/api/v1/recruiter",
    tags=["recruiter"]
)

@router.get("/dashboard")
def recruiter_dashboard():

    db: Session = SessionLocal()

    try:

        analyses = (
            db.query(AnalysisRecord)
            .order_by(desc(AnalysisRecord.created_at))
            .limit(25)
            .all()
        )

        total_candidates = len(analyses)

        bookmarked_candidates = len(
            [a for a in analyses if a.bookmarked]
        )

        average_fit_score = 0

        if analyses:
            average_fit_score = round(
                sum(a.fit_score for a in analyses) / len(analyses),
                2
            )

        pipeline = {
            "screening": 0,
            "interview": 0,
            "offer": 0,
            "hired": 0,
            "rejected": 0,
        }

        recent_candidates = []

        for analysis in analyses:

            status = analysis.candidate_status or "screening"

            if status not in pipeline:
                pipeline[status] = 0

            pipeline[status] += 1

            recent_candidates.append({
                "id": analysis.id,
                "candidate_name": analysis.candidate_name,
                "resume_filename": analysis.resume_filename,
                "fit_score": analysis.fit_score,
                "status": status,
                "bookmarked": analysis.bookmarked,
                "created_at": analysis.created_at.isoformat(),
                "recommendation": analysis.hiring_recommendation,
            })

        return {
            "total_candidates": total_candidates,
            "bookmarked_candidates": bookmarked_candidates,
            "average_fit_score": average_fit_score,
            "pipeline": pipeline,
            "recent_candidates": recent_candidates,
        }

    finally:
        db.close()