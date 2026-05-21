from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Form
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_recruiter
from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser


router = APIRouter(
    prefix="/api/v1/candidate-notes",
    tags=["candidate-notes"],
)


SAVED_NOTES = []


@router.post("/candidate/{candidate_id}")
def add_candidate_note(
    candidate_id: int,
    note: str = Form(...),
    note_type: str = Form("general"),
    visibility: str = Form("team"),
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    candidate = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found.",
        )

    note_record = {
        "id": len(SAVED_NOTES) + 1,
        "candidate_id": candidate.id,
        "candidate_name": candidate.candidate_name,
        "recruiter_id": recruiter.id,
        "recruiter_email": recruiter.email,
        "note": note,
        "note_type": note_type,
        "visibility": visibility,
        "created_at": datetime.utcnow().isoformat(),
    }

    SAVED_NOTES.append(note_record)

    return {
        "message": "Candidate note added.",
        "note": note_record,
    }


@router.get("/candidate/{candidate_id}")
def list_candidate_notes(
    candidate_id: int,
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    candidate = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == candidate_id)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found.",
        )

    notes = [
        note
        for note in SAVED_NOTES
        if note["candidate_id"] == candidate_id
        and note["recruiter_id"] == recruiter.id
    ]

    return {
        "candidate_id": candidate.id,
        "candidate_name": candidate.candidate_name,
        "count": len(notes),
        "notes": notes,
    }


@router.get("/")
def list_all_recruiter_notes(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    notes = [
        note
        for note in SAVED_NOTES
        if note["recruiter_id"] == recruiter.id
    ]

    return {
        "count": len(notes),
        "notes": notes,
    }