import os
from openai import OpenAI


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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
        model="gpt-4.1-mini",
        input=prompt,
    )

    return {
        "answer": response.output_text,
        "model": "gpt-4.1-mini",
    }