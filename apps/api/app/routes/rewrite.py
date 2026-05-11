from fastapi import APIRouter, Form, HTTPException

from app.services.ai_service import AIService

router = APIRouter(prefix="/api/v1", tags=["rewrite"])


@router.post("/rewrite")
def rewrite_resume(
    resume_text: str = Form(...),
    job_description: str = Form(...),
):
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text required.")

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description required.")

    try:
        rewritten = AIService.rewrite_resume(
            resume_text=resume_text,
            job_description=job_description,
        )

        return {
            "rewritten_resume": rewritten,
        }

    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Resume rewrite failed: {str(exc)}",
        )