from datetime import datetime
from io import BytesIO

from docx import Document
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pypdf import PdfReader

from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/api/v1", tags=["analyze"])

FAKE_HISTORY: list[dict] = []


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
        pages: list[str] = []

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
        "version": "2.0.0",
    }


@router.get("/history")
def history():
    return FAKE_HISTORY[:25]


@router.post("/analyze-upload")
async def analyze_upload(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
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

    score = ScoringService.score(
        resume_text=resume_text,
        job_description=job_description,
    )

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

        # upgraded scoring
        "ats_score": score.ats_score,
        "skill_score": score.skill_score,
        "experience_score": score.experience_score,
        "project_relevance_score": score.project_relevance_score,
        "seniority_match_score": score.seniority_match_score,
        "confidence_score": score.confidence_score,

        # recruiter explainability
        "category_scores": score.category_scores,
        "red_flags": score.red_flags,
        "hiring_recommendation": score.hiring_recommendation,
        "score_explanation": score.score_explanation,
    }

    FAKE_HISTORY.insert(
        0,
        {
            "id": len(FAKE_HISTORY) + 1,
            "created_at": datetime.utcnow().isoformat(),
            "candidate_name": result["candidate_name"],
            "resume_filename": result["resume_filename"],
            "fit_score": result["fit_score"],
            "predicted_label": result["predicted_label"],
            "semantic_similarity": result["semantic_similarity"],
            "matched_skills": result["matched_skills"],
            "missing_skills": result["missing_skills"],
            "confidence_score": result["confidence_score"],
            "hiring_recommendation": result["hiring_recommendation"],
        },
    )

    return result