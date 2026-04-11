import json
import os
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.schemas.analyze import AnalyzeResponse, HistoryItem
from app.services.scoring_service import ScoringService
from app.services.parser_service import extract_resume_text
from app.config import get_settings

router = APIRouter(prefix="/api/v1", tags=["analyze"])
settings = get_settings()


@router.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version}


@router.post("/analyze-upload", response_model=AnalyzeResponse)
async def analyze_upload(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await resume_file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded resume file is empty.")

    os.makedirs(settings.upload_dir, exist_ok=True)

    try:
        resume_text = extract_resume_text(
            filename=resume_file.filename,
            content=content,
            upload_dir=settings.upload_dir
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse resume file: {str(e)}")

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded resume.")

    result = ScoringService.score(resume_text=resume_text, job_description=job_description)

    record = AnalysisRecord(
        candidate_name=result.candidate_name,
        resume_filename=resume_file.filename,
        fit_score=result.fit_score,
        predicted_label=result.predicted_label,
        semantic_similarity=result.semantic_similarity,
        matched_skills=json.dumps(result.matched_skills),
        missing_skills=json.dumps(result.missing_skills),
        recommendations=json.dumps(result.recommendations),
        job_description=job_description,
    )
    db.add(record)
    db.commit()

    return AnalyzeResponse(
        fit_score=result.fit_score,
        predicted_label=result.predicted_label,
        semantic_similarity=result.semantic_similarity,
        matched_skills=result.matched_skills,
        missing_skills=result.missing_skills,
        strengths=result.strengths,
        recommendations=result.recommendations,
        candidate_name=result.candidate_name,
        resume_filename=resume_file.filename,
        model_version=result.model_version,
        ats_score=None,
        skill_score=None,
        experience_score=None,
    )

@router.get("/history", response_model=list[HistoryItem])
def history(db: Session = Depends(get_db)):
    rows = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(20).all()

    output = []
    for row in rows:
        output.append(
            HistoryItem(
                id=row.id,
                created_at=row.created_at.isoformat(),
                candidate_name=row.candidate_name,
                resume_filename=row.resume_filename,
                fit_score=row.fit_score,
                predicted_label=row.predicted_label,
                semantic_similarity=row.semantic_similarity,
                matched_skills=json.loads(row.matched_skills),
                missing_skills=json.loads(row.missing_skills),
                recommendations=json.loads(row.recommendations),
            )
        )
    return output
