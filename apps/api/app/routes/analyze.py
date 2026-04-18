from datetime import datetime
from io import BytesIO
import re

from docx import Document
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pypdf import PdfReader

router = APIRouter(prefix="/api/v1", tags=["analyze"])

FAKE_HISTORY: list[dict] = []


KNOWN_SKILLS = [
    "python",
    "fastapi",
    "flask",
    "django",
    "react",
    "typescript",
    "javascript",
    "sql",
    "postgresql",
    "mysql",
    "docker",
    "git",
    "machine learning",
    "ml",
    "nlp",
    "rest api",
    "aws",
    "ci/cd",
]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_skills(text: str) -> list[str]:
    lowered = normalize_text(text)
    found: list[str] = []
    for skill in KNOWN_SKILLS:
        if skill in lowered:
            found.append(skill)
    return found


def extract_required_skills(job_description: str) -> list[str]:
    return extract_skills(job_description)


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


def estimate_years_required(job_description: str) -> int | None:
    lowered = normalize_text(job_description)
    match = re.search(r"(\d+)\+?\s+years?", lowered)
    if match:
        return int(match.group(1))
    return None


def estimate_resume_experience_score(resume_text: str, required_years: int | None) -> int:
    lowered = normalize_text(resume_text)

    tech_signal_terms = [
        "engineer",
        "developer",
        "software",
        "full stack",
        "ai/ml",
        "machine learning",
        "fastapi",
        "react",
        "python",
        "typescript",
        "certification",
        "certifications",
    ]

    signal_hits = sum(1 for term in tech_signal_terms if term in lowered)

    if required_years is None:
        return min(90, 45 + signal_hits * 7)

    if required_years <= 1:
        return min(95, 50 + signal_hits * 7)
    if required_years == 2:
        return min(90, 40 + signal_hits * 7)
    if required_years == 3:
        return min(85, 30 + signal_hits * 7)

    return min(80, 25 + signal_hits * 6)


def estimate_education_signal(resume_text: str) -> int:
    lowered = normalize_text(resume_text)
    terms = [
        "certification",
        "certifications",
        "college",
        "university",
        "technical college",
        "academy",
        "engineering",
        "computer science",
        "ai/ml",
        "full stack",
    ]
    hits = sum(1 for term in terms if term in lowered)
    return min(100, 20 + hits * 10)


def compute_semantic_similarity(skill_score: int, experience_score: int, education_score: int) -> float:
    raw = (skill_score * 0.55) + (experience_score * 0.30) + (education_score * 0.15)
    similarity = raw / 100
    return round(max(0.20, min(0.98, similarity)), 4)


def label_from_score(score: int) -> str:
    if score >= 80:
        return "strong match"
    if score >= 60:
        return "potential match"
    return "weak match"


def build_strengths(matched_skills: list[str], experience_score: int, education_score: int) -> list[str]:
    strengths: list[str] = []

    if matched_skills:
        strengths.append(f"Matched skills: {', '.join(matched_skills)}")
    else:
        strengths.append("Resume contains some relevant technical keywords.")

    if experience_score >= 70:
        strengths.append("Resume shows promising technical experience or training signals.")

    if education_score >= 60:
        strengths.append("Resume includes education or certification signals relevant to technical roles.")

    return strengths


def build_recommendations(missing_skills: list[str], experience_score: int, required_years: int | None) -> list[str]:
    recommendations: list[str] = []

    if missing_skills:
        recommendations.append(f"Add or strengthen: {', '.join(missing_skills)}")
    else:
        recommendations.append("Resume aligns well with the sample job description.")

    if required_years and required_years >= 3 and experience_score < 70:
        recommendations.append("Add more evidence of hands-on engineering experience tied to job requirements.")

    return recommendations


@router.get("/health")
def health():
    return {"status": "ok", "service": "RecruitFlow AI Elite API", "version": "1.2.0"}


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

    required_skills = extract_required_skills(job_description)
    resume_skills = extract_skills(resume_text)

    matched_skills = [skill for skill in required_skills if skill in resume_skills]
    missing_skills = [skill for skill in required_skills if skill not in resume_skills]

    total_required = len(required_skills)
    skill_score = 100 if total_required == 0 else round((len(matched_skills) / total_required) * 100)

    required_years = estimate_years_required(job_description)
    experience_score = estimate_resume_experience_score(resume_text, required_years)
    education_score = estimate_education_signal(resume_text)

    ats_score = round((skill_score * 0.60) + (experience_score * 0.25) + (education_score * 0.15))
    fit_score = ats_score
    semantic_similarity = compute_semantic_similarity(skill_score, experience_score, education_score)

    result = {
        "fit_score": fit_score,
        "predicted_label": label_from_score(fit_score),
        "semantic_similarity": semantic_similarity,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": build_strengths(matched_skills, experience_score, education_score),
        "recommendations": build_recommendations(missing_skills, experience_score, required_years),
        "candidate_name": resume_text.splitlines()[0].strip() if resume_text.splitlines() else "Unknown",
        "resume_filename": resume_file.filename,
        "model_version": "demo-v1.2",
        "ats_score": ats_score,
        "skill_score": skill_score,
        "experience_score": experience_score,
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
