from dataclasses import dataclass
from typing import List

from app.services.parser_service import parse_job_description, parse_resume
from app.services.similarity_service import SimilarityService


@dataclass
class ScoreOutput:
    fit_score: float
    predicted_label: str
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    recommendations: List[str]
    candidate_name: str | None
    model_version: str = "embedding-hybrid-v2"


class ScoringService:
    @staticmethod
    def score(resume_text: str, job_description: str) -> ScoreOutput:
        resume = parse_resume(resume_text)
        job = parse_job_description(job_description)

        matched_skills = sorted(set(resume["skills"]).intersection(set(job["skills"])))
        missing_skills = sorted(set(job["skills"]) - set(resume["skills"]))

        skill_overlap_ratio = 0.0
        if job["skills"]:
            skill_overlap_ratio = len(matched_skills) / len(job["skills"])

        try:
            semantic_similarity = SimilarityService.embedding_similarity(
                resume["normalized_text"],
                job["normalized_text"]
            )
            model_version = "embedding-hybrid-v2"
        except Exception:
            semantic_similarity = SimilarityService.token_overlap_similarity(
                resume["normalized_text"],
                job["normalized_text"]
            )
            model_version = "token-fallback-v2"

        if job["years_signal"] > 0:
            if resume["years_signal"] >= job["years_signal"]:
                experience_score = 1.0
            elif resume["years_signal"] >= max(job["years_signal"] - 1, 0):
                experience_score = 0.75
            else:
                experience_score = 0.45
        else:
            experience_score = 0.75

        fit_score = (
            semantic_similarity * 45 +
            skill_overlap_ratio * 40 +
            experience_score * 15
        )

        fit_score = round(min(max(fit_score, 0), 100), 2)

        if fit_score >= 80:
            predicted_label = "strong match"
        elif fit_score >= 60:
            predicted_label = "potential match"
        else:
            predicted_label = "weak match"

        strengths: List[str] = []
        if matched_skills:
            strengths.append(f"Matched key skills: {', '.join(matched_skills[:8])}")
        if semantic_similarity >= 0.55:
            strengths.append("Resume content is semantically well aligned with the target role.")
        if experience_score >= 0.75:
            strengths.append("Experience level appears reasonably aligned with the job requirement.")

        recommendations: List[str] = []
        if missing_skills:
            recommendations.append(f"Add or strengthen evidence for: {', '.join(missing_skills[:8])}")
        if semantic_similarity < 0.45:
            recommendations.append("Rewrite summary and project bullets to better mirror the language of the job description.")
        if skill_overlap_ratio < 0.5:
            recommendations.append("Add role-specific tools, frameworks, and measurable achievements relevant to this position.")
        if resume["years_signal"] == 0 and job["years_signal"] > 0:
            recommendations.append("Make your experience duration more explicit in your resume bullets or summary.")

        if not strengths:
            strengths.append("Resume shows partial alignment, but stronger role-specific evidence would improve the score.")

        return ScoreOutput(
            fit_score=fit_score,
            predicted_label=predicted_label,
            semantic_similarity=round(semantic_similarity, 4),
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            strengths=strengths,
            recommendations=recommendations,
            candidate_name=resume["candidate_name"],
            model_version=model_version,
        )
