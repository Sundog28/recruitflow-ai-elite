from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.copilot_service import (
    generate_candidate_summary
)

router = APIRouter(
    prefix="/api/v1/copilot",
    tags=["copilot"]
)

@router.get("/candidate/{candidate_id}")
def candidate_copilot(candidate_id: int):

    db: Session = SessionLocal()

    try:

        candidate = (
            db.query(AnalysisRecord)
            .filter(
                AnalysisRecord.id == candidate_id
            )
            .first()
        )

        if not candidate:
            return {
                "detail": "Candidate not found."
            }

        return generate_candidate_summary(candidate)

    finally:
        db.close()