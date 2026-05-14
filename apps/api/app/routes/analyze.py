from io import BytesIO
import json
import uuid

from docx import Document
from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AnalysisRecord
from app.db.models import RecruiterUser

from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/api/v1", tags=["analyze"])


def parse_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Resume text file must be UTF-8.",
        )


def parse_pdf(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        pages = []

        for page in reader.pages:
            pages.append(page.extract_text() or "")

        text = "\n".join(pages).strip()

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from PDF.",
            )

        return text

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse PDF: {str(exc)}",
        )


def parse_docx(content: bytes) -> str:
    try:
        doc = Document(BytesIO(content))

        text = "\n".join(
            p.text for p in doc.paragraphs
        ).strip()

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from DOCX.",
            )

        return text

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse DOCX: {str(exc)}",
        )


def extract_resume_text(filename: str, content: bytes) -> str:
    lower = filename.lower()

    if lower.endswith(".txt"):
        return parse_txt(content)

    if lower.endswith(".pdf"):
        return parse_pdf(content)

    if lower.endswith(".docx"):
        return parse_docx(content)

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Please upload a .txt, .pdf, or .docx resume.",
    )


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "RecruitFlow AI Elite API",
        "version": "2.6.0",
    }


@router.get("/history")
def history(db: Session = Depends(get_db)):
    records = (
        db.query(AnalysisRecord)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(25)
        .all()
    )

    history_items = []

    for item in records:
        history_items.append(
            {
                "id": item.id,
                "created_at": item.created_at.isoformat(),
                "candidate_name": item.candidate_name,
                "resume_filename": item.resume_filename,
                "fit_score": item.fit_score,
                "predicted_label": item.predicted_label,
                "semantic_similarity": item.semantic_similarity,
                "matched_skills": item.matched_skills.split(", ")
                if item.matched_skills
                else [],
                "missing_skills": item.missing_skills.split(", ")
                if item.missing_skills
                else [],
                "confidence_score": item.confidence_score,
                "hiring_recommendation": item.hiring_recommendation,
                "share_id": item.share_id,
            }
        )

    return history_items


@router.get("/report/{share_id}")
def get_report(
    share_id: str,
    db: Session = Depends(get_db),
):
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.share_id == share_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    return {
        "id": record.id,
        "created_at": record.created_at.isoformat(),
        "candidate_name": record.candidate_name,
        "resume_filename": record.resume_filename,
        "fit_score": record.fit_score,
        "predicted_label": record.predicted_label,
        "semantic_similarity": record.semantic_similarity,
        "matched_skills": record.matched_skills.split(", ")
        if record.matched_skills
        else [],
        "missing_skills": record.missing_skills.split(", ")
        if record.missing_skills
        else [],
        "recommendations": json.loads(record.recommendations or "[]"),
        "strengths": json.loads(record.strengths or "[]"),
        "red_flags": json.loads(record.red_flags or "[]"),
        "score_explanation": json.loads(record.score_explanation or "[]"),
        "ats_score": record.ats_score,
        "skill_score": record.skill_score,
        "experience_score": record.experience_score,
        "project_relevance_score": record.project_relevance_score,
        "seniority_match_score": record.seniority_match_score,
        "confidence_score": record.confidence_score,
        "category_scores": json.loads(record.category_scores or "{}"),
        "hiring_recommendation": record.hiring_recommendation,
        "model_version": record.model_version,
        "job_description": record.job_description,
        "share_id": record.share_id,
    }


@router.post("/analyze-upload")
async def analyze_upload(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required.",
        )

    if not resume_file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded.",
        )

    content = await resume_file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded resume file is empty.",
        )

    resume_text = extract_resume_text(
        resume_file.filename,
        content,
    )

    recruiter = (
        db.query(RecruiterUser)
        .filter(RecruiterUser.id == 1)
        .first()
    )

    if recruiter:
        if (
            recruiter.plan == "free"
            and recruiter.analysis_count >= 3
        ):
            raise HTTPException(
                status_code=403,
                detail="Free trial limit reached. Upgrade to RecruitFlow Pro.",
            )

    score = ScoringService.score(
        resume_text=resume_text,
        job_description=job_description,
    )

    share_id = str(uuid.uuid4())

    result = {
        "fit_score": score.fit_score,
        "predicted_label": score.predicted_label,
        "semantic_similarity": score.semantic_similarity,
        "matched_skills": score.matched_skills,
        "missing_skills": score.missing_skills,
        "strengths": score.strengths,
        "recommendations": score.recommendations,
        "candidate_name": score.candidate_name,
        "resume_filename": resume_file.filename,
        "model_version": score.model_version,
        "ats_score": score.ats_score,
        "skill_score": score.skill_score,
        "experience_score": score.experience_score,
        "project_relevance_score": score.project_relevance_score,
        "seniority_match_score": score.seniority_match_score,
        "confidence_score": score.confidence_score,
        "category_scores": score.category_scores,
        "red_flags": score.red_flags,
        "hiring_recommendation": score.hiring_recommendation,
        "score_explanation": score.score_explanation,
        "share_id": share_id,
    }

    db_record = AnalysisRecord(
        candidate_name=result["candidate_name"],
        resume_filename=result["resume_filename"],
        fit_score=result["fit_score"],
        predicted_label=result["predicted_label"],
        semantic_similarity=result["semantic_similarity"],
        matched_skills=", ".join(result["matched_skills"]),
        missing_skills=", ".join(result["missing_skills"]),
        recommendations=json.dumps(result["recommendations"]),
        strengths=json.dumps(result["strengths"]),
        red_flags=json.dumps(result["red_flags"]),
        score_explanation=json.dumps(result["score_explanation"]),
        hiring_recommendation=result["hiring_recommendation"],
        ats_score=result["ats_score"],
        skill_score=result["skill_score"],
        experience_score=result["experience_score"],
        confidence_score=result["confidence_score"],
        project_relevance_score=result["project_relevance_score"],
        seniority_match_score=result["seniority_match_score"],
        category_scores=json.dumps(result["category_scores"]),
        model_version=result["model_version"],
        share_id=share_id,
        job_description=job_description,
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    if recruiter:
        recruiter.analysis_count = (recruiter.analysis_count or 0) + 1
        db.commit()

    return result