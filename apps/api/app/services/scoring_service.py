from dataclasses import dataclass
from typing import List
from app.services.embedding_service import EmbeddingService
from app.services.parser_service import parse_job_description, parse_resume


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

        resume_skills = set(resume["skills"])
        job_skills = set(job["skills"])

        matched_skills = sorted(resume_skills.intersection(job_skills))
        missing_skills = sorted(job_skills - resume_skills)

        skill_overlap_ratio = 0.0
        if job_skills:
            skill_overlap_ratio = len(matched_skills) / len(job_skills)

        semantic_similarity = EmbeddingService.similarity(
            resume["normalized_text"],
            job["normalized_text"],
        )
        model_version = "lightweight-sequence-similarity-v1"

        experience_score = ScoringService._experience_score(
            resume_years=resume["years_signal"],
            job_years=job["years_signal"],
        )

        fit_score = (
            semantic_similarity * 45
            + skill_overlap_ratio * 40
            + experience_score * 15
        )

        fit_score = round(min(max(fit_score, 0), 100), 2)

        if fit_score >= 80:
            predicted_label = "strong match"
        elif fit_score >= 60:
            predicted_label = "potential match"
        else:
            predicted_label = "weak match"

        strengths = ScoringService._build_strengths(
            matched_skills=matched_skills,
            semantic_similarity=semantic_similarity,
            experience_score=experience_score,
        )

        recommendations = ScoringService._build_recommendations(
            missing_skills=missing_skills,
            semantic_similarity=semantic_similarity,
            skill_overlap_ratio=skill_overlap_ratio,
            resume_years=resume["years_signal"],
            job_years=job["years_signal"],
        )

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

    @staticmethod
    def _experience_score(resume_years: int, job_years: int) -> float:
        if job_years > 0:
            if resume_years >= job_years:
                return 1.0
            if resume_years >= max(job_years - 1, 0):
                return 0.75
            return 0.45

        return 0.75

    @staticmethod
    def _build_strengths(
        matched_skills: list[str],
        semantic_similarity: float,
        experience_score: float,
    ) -> list[str]:
        strengths: list[str] = []

        if matched_skills:
            strengths.append(
                f"Matched key skills: {', '.join(matched_skills[:8])}"
            )

        if semantic_similarity >= 0.55:
            strengths.append(
                "Resume content is semantically aligned with the target role."
            )

        if experience_score >= 0.75:
            strengths.append(
                "Experience level appears reasonably aligned with the job requirement."
            )

        if not strengths:
            strengths.append(
                "Resume shows partial alignment, but stronger role-specific evidence would improve the score."
            )

        return strengths

    @staticmethod
    def _build_recommendations(
        missing_skills: list[str],
        semantic_similarity: float,
        skill_overlap_ratio: float,
        resume_years: int,
        job_years: int,
    ) -> list[str]:
        recommendations: list[str] = []

        if missing_skills:
            recommendations.append(
                f"Add or strengthen evidence for: {', '.join(missing_skills[:8])}"
            )

        if semantic_similarity < 0.45:
            recommendations.append(
                "Rewrite the resume summary and project bullets to better mirror the job description."
            )

        if skill_overlap_ratio < 0.5:
            recommendations.append(
                "Add role-specific tools, frameworks, and measurable achievements relevant to this position."
            )

        if resume_years == 0 and job_years > 0:
            recommendations.append(
                "Make your experience duration more explicit in your resume bullets or summary."
            )

        if not recommendations:
            recommendations.append(
                "Resume is well aligned. Add quantified project outcomes to make it stronger."
            )

        return recommendations