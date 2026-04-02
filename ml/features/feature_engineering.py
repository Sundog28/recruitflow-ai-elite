from __future__ import annotations

from app.services.parser_service import ParsedText, SENIORITY_ORDER


def _ratio(numerator: int, denominator: int) -> float:
    return 0.0 if denominator <= 0 else round(numerator / denominator, 4)


def build_feature_vector(
    parsed_resume: ParsedText,
    parsed_job: ParsedText,
    matched_skills: list[str],
    missing_skills: list[str],
    semantic_similarity: float,
) -> dict[str, float]:
    required_skill_count = len(parsed_job.skills)
    matched_count = len(matched_skills)
    missing_count = len(missing_skills)
    skill_overlap_ratio = _ratio(matched_count, required_skill_count)
    experience_gap = parsed_resume.years_experience - parsed_job.years_experience
    experience_score = 1.0 if experience_gap >= 0 else max(0.0, 1.0 + (experience_gap / 10.0))
    education_match = 1.0 if not parsed_job.education_keywords else float(
        any(item in parsed_resume.education_keywords for item in parsed_job.education_keywords)
    )
    seniority_gap = SENIORITY_ORDER.index(parsed_resume.seniority) - SENIORITY_ORDER.index(parsed_job.seniority)
    seniority_match = 1.0 if seniority_gap >= 0 else 0.0
    keyword_density = _ratio(sum(1 for skill in parsed_job.skills if skill in parsed_resume.normalized_text), max(1, len(parsed_resume.normalized_text.split())))

    return {
        "education_match": round(education_match, 4),
        "experience_gap": float(experience_gap),
        "experience_score": round(experience_score, 4),
        "keyword_density": round(keyword_density, 4),
        "matched_skills": float(matched_count),
        "missing_skills": float(missing_count),
        "semantic_similarity": round(float(semantic_similarity), 4),
        "seniority_match": round(seniority_match, 4),
        "skill_overlap_ratio": round(skill_overlap_ratio, 4),
        "total_job_skills": float(required_skill_count),
    }
