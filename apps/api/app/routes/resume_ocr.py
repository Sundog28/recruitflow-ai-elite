import base64
import os

from fastapi import APIRouter
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile

from openai import OpenAI

from app.routes.analyze import extract_resume_text
from app.services.scoring_service import ScoringService


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    api_key=OPENAI_API_KEY,
)

router = APIRouter(
    prefix="/api/v1/ocr",
    tags=["ocr"],
)


SUPPORTED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


def image_bytes_to_data_url(
    content: bytes,
    content_type: str,
) -> str:
    encoded = base64.b64encode(content).decode("utf-8")

    return f"data:{content_type};base64,{encoded}"


def extract_resume_text_from_image(
    content: bytes,
    content_type: str,
) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured.",
        )

    data_url = image_bytes_to_data_url(
        content=content,
        content_type=content_type,
    )

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Extract all readable resume text from this image. "
                            "Preserve names, headings, skills, job titles, "
                            "companies, dates, education, projects, and bullet points. "
                            "Return only the extracted resume text."
                        ),
                    },
                    {
                        "type": "input_image",
                        "image_url": data_url,
                    },
                ],
            }
        ],
    )

    text = response.output_text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable resume text from image.",
        )

    return text


@router.post("/parse-resume")
async def parse_resume_with_ocr(
    resume_file: UploadFile = File(...),
    job_description: str = Form(""),
):
    if not resume_file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded.",
        )

    content = await resume_file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    content_type = resume_file.content_type or ""

    if content_type in SUPPORTED_IMAGE_TYPES:
        extracted_text = extract_resume_text_from_image(
            content=content,
            content_type=content_type,
        )

        extraction_method = "openai_vision_ocr"

    else:
        extracted_text = extract_resume_text(
            filename=resume_file.filename,
            content=content,
        )

        extraction_method = "standard_document_parser"

    response = {
        "filename": resume_file.filename,
        "content_type": content_type,
        "extraction_method": extraction_method,
        "extracted_text": extracted_text,
        "character_count": len(extracted_text),
    }

    if job_description.strip():
        score = ScoringService.score(
            resume_text=extracted_text,
            job_description=job_description,
        )

        response["analysis"] = {
            "fit_score": score.fit_score,
            "predicted_label": score.predicted_label,
            "semantic_similarity": score.semantic_similarity,
            "matched_skills": score.matched_skills,
            "missing_skills": score.missing_skills,
            "strengths": score.strengths,
            "recommendations": score.recommendations,
            "candidate_name": score.candidate_name,
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
        }

    return response