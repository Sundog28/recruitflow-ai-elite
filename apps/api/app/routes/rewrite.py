from fastapi import APIRouter, Form, HTTPException
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/v1", tags=["rewrite"])


def simple_rewrite(resume_text: str, job_description: str) -> str:
    lines = resume_text.splitlines()
    improved = []

    improved.append("PROFESSIONAL SUMMARY")
    improved.append(
        "AI/ML-focused software engineer with experience building scalable APIs, full stack applications, and machine learning systems aligned to job requirements."
    )
    improved.append("")

    improved.append("CORE SKILLS")
    improved.append("Python, FastAPI, React, TypeScript, SQL, Docker, Machine Learning, NLP, REST APIs")
    improved.append("")

    improved.append("EXPERIENCE HIGHLIGHTS")

    for line in lines:
        if line.strip():
            improved.append(f"- {line.strip()} (optimized for role relevance)")

    improved.append("")
    improved.append("TARGET ROLE ALIGNMENT")
    improved.append(job_description[:300] + "...")

    return "\n".join(improved)


@router.post("/rewrite")
def rewrite_resume(
    resume_text: str = Form(...),
    job_description: str = Form(...),
):
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text required.")

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description required.")

    rewritten = AIService.rewrite_resume(resume_text, job_description)

    return {
        "rewritten_resume": rewritten
    }