from datetime import datetime
from io import BytesIO

from docx import Document
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pypdf import PdfReader

router = APIRouter(prefix="/api/v1", tags=["analyze"])

FAKE_HISTORY: list[dict] = []


def extract_skills(text: str) -> list[str]:
    known = [
        "python",
        "fastapi",
        "react",
        "typescript",
        "sql",
        "docker",
        "git",
        "machine learning",
        "nlp",
        "rest api",
    ]
    lowered = text.lower()
    return [skill for skill in known if skill in lowered]


def parse_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Resume text file must be UTF-8.")


def parse_pdf(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        pages: list[str] = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n".join(pages).strip()
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")
        return text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")


def parse_docx(content: bytes) -> str:
    try:
        doc = Document(BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs).strip()
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract readable text from DOCX.")
        return text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")


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
        detail="Unsupported file type. Please upload a .txt, .pdf, or .docx resume."
    )


@router.get("/health")
def health():
    return {"status": "ok", "service": "RecruitFlow AI Elite API", "version": "1.1.0"}


@router.get("/history")
def history():
    return FAKE_HISTORY


@router.post("/analyze-upload")
async def analyze_upload(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
):
    if not resume_file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content = await resume_file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded resume file is empty.")

    resume_text = extract_resume_text(resume_file.filename, content)

    matched_skills = extract_skills(resume_text)
    missing_skills = [
        skill for skill in extract_skills(job_description)
        if skill not in matched_skills
    ]

    fit_score = max(40, min(95, 60 + len(matched_skills) * 4 - len(missing_skills) * 2))
    predicted_label = "strong match" if fit_score >= 80 else "potential match" if fit_score >= 60 else "weak match"

    result = {
        "fit_score": fit_score,
        "predicted_label": predicted_label,
        "semantic_similarity": round(min(0.95, 0.45 + len(matched_skills) * 0.05), 4),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": [f"Matched skills: {', '.join(matched_skills)}"] if matched_skills else ["Resume contains some relevant technical keywords."],
        "recommendations": [f"Add or strengthen: {', '.join(missing_skills)}"] if missing_skills else ["Resume aligns well with the sample job description."],
        "candidate_name": resume_text.splitlines()[0].strip() if resume_text.splitlines() else "Unknown",
        "resume_filename": resume_file.filename,
        "model_version": "demo-v1.1",
        "ats_score": None,
        "skill_score": None,
        "experience_score": None,
    }

    FAKE_HISTORY.insert(0, {
        "id": len(FAKE_HISTORY) + 1,
        "created_at": datetime.utcnow().isoformat(),
        "candidate_name": result["candidate_name"],
        "resume_filename": result["resume_filename"],
        "fit_score": result["fit_score"],
        "predicted_label": result["predicted_label"],
        "semantic_similarity": result["semantic_similarity"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "recommendations": result["recommendations"],
    })

    return result
