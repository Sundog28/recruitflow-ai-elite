from fastapi import APIRouter
from fastapi import Form
from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

router = APIRouter(
    prefix="/api/v1/recruiter",
    tags=["recruiter"],
)

VALID_STATUSES = {
    "screening",
    "interview",
    "offer",
    "hired",
    "rejected",
}


def serialize_candidate(analysis: AnalysisRecord):
    return {
        "id": analysis.id,
        "candidate_name": analysis.candidate_name,
        "resume_filename": analysis.resume_filename,
        "fit_score": analysis.fit_score,
        "status": analysis.candidate_status or "screening",
        "bookmarked": bool(analysis.bookmarked),
        "created_at": analysis.created_at.isoformat(),
        "recommendation": analysis.hiring_recommendation,
        "notes": analysis.recruiter_notes or "",
    }


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
        bookmarked_candidates = len([a for a in analyses if a.bookmarked])

        average_fit_score = 0
        if analyses:
            average_fit_score = round(
                sum(a.fit_score for a in analyses) / len(analyses),
                2,
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
            recent_candidates.append(serialize_candidate(analysis))

        return {
            "total_candidates": total_candidates,
            "bookmarked_candidates": bookmarked_candidates,
            "average_fit_score": average_fit_score,
            "pipeline": pipeline,
            "recent_candidates": recent_candidates,
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int,
    status: str = Form(...),
):
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate status.",
        )

    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.candidate_status = status
        db.commit()
        db.refresh(analysis)

        return {
            "message": "Candidate status updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/bookmark")
def toggle_candidate_bookmark(candidate_id: int):
    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.bookmarked = not bool(analysis.bookmarked)

        db.commit()
        db.refresh(analysis)

        return {
            "message": "Candidate bookmark updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/notes")
def update_candidate_notes(
    candidate_id: int,
    notes: str = Form(""),
):
    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.recruiter_notes = notes

        db.commit()
        db.refresh(analysis)

        return {
            "message": "Recruiter notes updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()