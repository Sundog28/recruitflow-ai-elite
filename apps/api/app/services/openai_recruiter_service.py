import hashlib
import json
import os

from openai import OpenAI

from app.services.redis_service import get_cache
from app.services.redis_service import set_cache


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = "gpt-4.1-mini"

client = OpenAI(
    api_key=OPENAI_API_KEY,
)


def build_candidate_context(candidate):
    return f"""
Candidate Name: {candidate.candidate_name}
Resume Filename: {candidate.resume_filename}
Fit Score: {candidate.fit_score}
Predicted Label: {candidate.predicted_label}
Semantic Similarity: {candidate.semantic_similarity}

Matched Skills:
{candidate.matched_skills}

Missing Skills:
{candidate.missing_skills}

Strengths:
{candidate.strengths}

Red Flags:
{candidate.red_flags}

Hiring Recommendation:
{candidate.hiring_recommendation}

Score Explanation:
{candidate.score_explanation}

ATS Score: {candidate.ats_score}
Skill Score: {candidate.skill_score}
Experience Score: {candidate.experience_score}
Project Relevance Score: {candidate.project_relevance_score}
Seniority Match Score: {candidate.seniority_match_score}
Recruiter Notes: {candidate.recruiter_notes}
Candidate Status: {candidate.candidate_status}
"""


def generate_openai_recruiter_response(
    candidate,
    question: str,
):
    if not OPENAI_API_KEY:
        return {
            "answer": (
                "OpenAI is not configured yet. Add OPENAI_API_KEY "
                "to the backend environment variables."
            ),
            "model": "not_configured",
        }

    cache_payload = {
        "candidate_id": candidate.id,
        "fit_score": candidate.fit_score,
        "updated_context": build_candidate_context(candidate),
        "question": question,
        "model": MODEL_NAME,
    }

    cache_key = (
        "openai_recruiter:"
        + hashlib.md5(
            json.dumps(
                cache_payload,
                sort_keys=True,
                default=str,
            ).encode("utf-8")
        ).hexdigest()
    )

    cached_response = get_cache(cache_key)

    if cached_response:
        return cached_response

    candidate_context = build_candidate_context(candidate)

    prompt = f"""
You are RecruitFlow AI Elite, an expert AI recruiter assistant.

Your job:
- Help recruiters make hiring decisions.
- Be practical, specific, and evidence-based.
- Use the candidate analysis data only.
- Do not invent experience that is not shown.
- Mention risks clearly.
- Give recruiter-ready recommendations.

Candidate analysis:
{candidate_context}

Recruiter question:
{question}

Respond with:
1. Direct answer
2. Key evidence
3. Risks or concerns
4. Recommended next step
"""

    response = client.responses.create(
        model=MODEL_NAME,
        input=prompt,
    )

    response_payload = {
        "answer": response.output_text,
        "model": MODEL_NAME,
    }

    set_cache(
        cache_key,
        response_payload,
        expiration_seconds=3600,
    )

    return response_payload