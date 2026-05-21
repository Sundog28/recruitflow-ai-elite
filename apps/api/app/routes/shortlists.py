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
    prefix="/api/v1/shortlists",
    tags=["shortlists"],
)


SAVED_SHORTLISTS = []


@router.post("/create")
def create_shortlist(
    name: str = Form(...),
    description: str = Form(""),
    candidate_ids: str = Form(...),
    db: Session = Depends(get_db),
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    parsed_ids = [
        int(item.strip())
        for item in candidate_ids.split(",")
        if item.strip().isdigit()
    ]

    if not parsed_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one valid candidate ID is required.",
        )

    candidates = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.recruiter_id == recruiter.id)
        .filter(AnalysisRecord.id.in_(parsed_ids))
        .all()
    )

    shortlist = {
        "id": len(SAVED_SHORTLISTS) + 1,
        "recruiter_id": recruiter.id,
        "name": name,
        "description": description,
        "candidate_ids": [candidate.id for candidate in candidates],
        "count": len(candidates),
        "candidates": [
            {
                "id": candidate.id,
                "candidate_name": candidate.candidate_name,
                "resume_filename": candidate.resume_filename,
                "fit_score": candidate.fit_score,
                "status": candidate.candidate_status,
                "hiring_recommendation": candidate.hiring_recommendation,
            }
            for candidate in candidates
        ],
    }

    SAVED_SHORTLISTS.append(shortlist)

    return {
        "message": "Shortlist created.",
        "shortlist": shortlist,
    }


@router.get("/")
def list_shortlists(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    shortlists = [
        item
        for item in SAVED_SHORTLISTS
        if item["recruiter_id"] == recruiter.id
    ]

    return {
        "count": len(shortlists),
        "shortlists": shortlists,
    }