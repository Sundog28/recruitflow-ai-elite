from dataclasses import dataclass
from typing import Dict, List

from app.services.embedding_service import EmbeddingService
from app.services.parser_service import calculate_project_relevance, parse_job_description, parse_resume


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
    model_version: str
    ats_score: float
    skill_score: float
    experience_score: float
    project_relevance_score: float
    seniority_match_score: float
    confidence_score: float
    category_scores: Dict[str, float]
    red_flags: List[str]
    hiring_recommendation: str
    score_explanation: List[str]


class ScoringService:
    @staticmethod
    def score(resume_text: str, job_description: str) -> ScoreOutput:
        resume = parse_resume(resume_text)
        job = parse_job_description(job_description)

        resume_skills = set(resume["skills"])
        job_skills = set(job["skills"])

        matched_skills = sorted(resume_skills.intersection(job_skills))
        missing_skills = sorted(job_skills - resume_skills)

        semantic_similarity = EmbeddingService.similarity(
            resume["normalized_text"],
            job["normalized_text"],
        )

        skill_score = ScoringService._skill_score(matched_skills, job_skills)
        experience_score = ScoringService._experience_score(
            resume_years=resume["years_signal"],
            job_years=job["years_signal"],
        )
        seniority_match_score = ScoringService._seniority_score(
            resume_seniority=resume["seniority"],
            job_seniority=job["seniority"],
        )
        project_relevance_score = calculate_project_relevance(resume_text, job_description) * 100
        category_scores = ScoringService._category_scores(
            resume_categories=resume["skill_categories"],
            job_categories=job["skill_categories"],
        )
        ats_score = ScoringService._ats_score(
            resume_sections=resume["sections"],
            skill_score=skill_score,
            red_flags=resume["red_flags"],
        )

        fit_score = (
            semantic_similarity * 22
            + skill_score * 0.28
            + experience_score * 0.15
            + seniority_match_score * 0.10
            + project_relevance_score * 0.15
            + ats_score * 0.10
        )

        fit_score = round(min(max(fit_score, 0), 100), 2)
        confidence_score = ScoringService._confidence_score(
            resume_text=resume_text,
            matched_skills=matched_skills,
            red_flags=resume["red_flags"],
            sections=resume["sections"],
        )

        if fit_score >= 82:
            predicted_label = "strong match"
        elif fit_score >= 62:
            predicted_label = "potential match"
        else:
            predicted_label = "weak match"

        strengths = ScoringService._build_strengths(
            matched_skills=matched_skills,
            semantic_similarity=semantic_similarity,
            experience_score=experience_score,
            project_relevance_score=project_relevance_score,
            seniority_match_score=seniority_match_score,
        )

        recommendations = ScoringService._build_recommendations(
            missing_skills=missing_skills,
            semantic_similarity=semantic_similarity,
            skill_score=skill_score,
            red_flags=resume["red_flags"],
            project_relevance_score=project_relevance_score,
        )

        hiring_recommendation = ScoringService._hiring_recommendation(
            fit_score=fit_score,
            confidence_score=confidence_score,
            red_flags=resume["red_flags"],
        )

        score_explanation = ScoringService._score_explanation(
            skill_score=skill_score,
            semantic_similarity=semantic_similarity,
            experience_score=experience_score,
            seniority_match_score=seniority_match_score,
            project_relevance_score=project_relevance_score,
            ats_score=ats_score,
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
            model_version="recruiter-weighted-v2",
            ats_score=round(ats_score, 2),
            skill_score=round(skill_score, 2),
            experience_score=round(experience_score, 2),
            project_relevance_score=round(project_relevance_score, 2),
            seniority_match_score=round(seniority_match_score, 2),
            confidence_score=round(confidence_score, 2),
            category_scores=category_scores,
            red_flags=resume["red_flags"],
            hiring_recommendation=hiring_recommendation,
            score_explanation=score_explanation,
        )

    @staticmethod
    def _skill_score(matched_skills: List[str], job_skills: set[str]) -> float:
        if not job_skills:
            return 75.0
        return min((len(matched_skills) / len(job_skills)) * 100, 100)

    @staticmethod
    def _experience_score(resume_years: int, job_years: int) -> float:
        if job_years > 0:
            if resume_years >= job_years:
                return 100.0
            if resume_years >= max(job_years - 1, 0):
                return 78.0
            return 48.0

        return 75.0

    @staticmethod
    def _seniority_score(resume_seniority: str, job_seniority: str) -> float:
        levels = {"entry": 1, "mid": 2, "senior": 3}
        resume_level = levels.get(resume_seniority, 1)
        job_level = levels.get(job_seniority, 1)

        if resume_level == job_level:
            return 100.0
        if resume_level > job_level:
            return 88.0
        if job_level - resume_level == 1:
            return 68.0
        return 42.0

    @staticmethod
    def _category_scores(resume_categories: Dict[str, List[str]], job_categories: Dict[str, List[str]]) -> Dict[str, float]:
        scores = {}

        for category, job_skills in job_categories.items():
            if not job_skills:
                scores[category] = 100.0
                continue

            matched = set(resume_categories.get(category, [])).intersection(set(job_skills))
            scores[category] = round((len(matched) / len(job_skills)) * 100, 2)

        return scores

    @staticmethod
    def _ats_score(resume_sections: Dict[str, bool], skill_score: float, red_flags: List[str]) -> float:
        section_score = sum(1 for exists in resume_sections.values() if exists) / max(len(resume_sections), 1) * 100
        penalty = min(len(red_flags) * 8, 32)
        return max((section_score * 0.45 + skill_score * 0.55) - penalty, 0)

    @staticmethod
    def _confidence_score(
        resume_text: str,
        matched_skills: List[str],
        red_flags: List[str],
        sections: Dict[str, bool],
    ) -> float:
        word_count = len(resume_text.split())
        base = 50.0

        if word_count >= 180:
            base += 15
        if word_count >= 350:
            base += 10
        if len(matched_skills) >= 5:
            base += 15
        if sum(1 for exists in sections.values() if exists) >= 3:
            base += 10

        base -= len(red_flags) * 7
        return min(max(base, 20), 100)

    @staticmethod
    def _build_strengths(
        matched_skills: List[str],
        semantic_similarity: float,
        experience_score: float,
        project_relevance_score: float,
        seniority_match_score: float,
    ) -> List[str]:
        strengths: List[str] = []

        if matched_skills:
            strengths.append(f"Matched key skills: {', '.join(matched_skills[:10])}")

        if semantic_similarity >= 0.55:
            strengths.append("Resume language is aligned with the target role.")

        if experience_score >= 75:
            strengths.append("Experience level appears reasonably aligned with the job requirement.")

        if project_relevance_score >= 60:
            strengths.append("Project evidence supports the target role requirements.")

        if seniority_match_score >= 85:
            strengths.append("Seniority appears aligned with the role level.")

        if not strengths:
            strengths.append("Resume shows partial alignment, but needs stronger role-specific evidence.")

        return strengths

    @staticmethod
    def _build_recommendations(
        missing_skills: List[str],
        semantic_similarity: float,
        skill_score: float,
        red_flags: List[str],
        project_relevance_score: float,
    ) -> List[str]:
        recommendations: List[str] = []

        if missing_skills:
            recommendations.append(f"Add or strengthen evidence for: {', '.join(missing_skills[:10])}")

        if semantic_similarity < 0.45:
            recommendations.append("Rewrite summary and project bullets to mirror the job description more closely.")

        if skill_score < 60:
            recommendations.append("Add more role-specific tools, frameworks, and measurable technical achievements.")

        if project_relevance_score < 50:
            recommendations.append("Add stronger project bullets showing how the candidate used the job’s target technologies.")

        recommendations.extend(red_flags)

        if not recommendations:
            recommendations.append("Resume is well aligned. Add quantified project outcomes to make it stronger.")

        return recommendations

    @staticmethod
    def _hiring_recommendation(fit_score: float, confidence_score: float, red_flags: List[str]) -> str:
        if fit_score >= 82 and confidence_score >= 70 and len(red_flags) <= 1:
            return "Recommended for recruiter screen."
        if fit_score >= 62:
            return "Potential fit. Review project depth and missing skill evidence."
        return "Not recommended yet. Resume needs stronger alignment before recruiter review."

    @staticmethod
    def _score_explanation(
        skill_score: float,
        semantic_similarity: float,
        experience_score: float,
        seniority_match_score: float,
        project_relevance_score: float,
        ats_score: float,
    ) -> List[str]:
        return [
            f"Skill coverage contributed {round(skill_score, 2)} based on matched required skills.",
            f"Semantic similarity contributed {round(semantic_similarity, 4)} based on resume/job language alignment.",
            f"Experience match contributed {round(experience_score, 2)} based on years-of-experience signals.",
            f"Seniority match contributed {round(seniority_match_score, 2)} based on detected role level.",
            f"Project relevance contributed {round(project_relevance_score, 2)} based on project evidence and target skills.",
            f"ATS quality contributed {round(ats_score, 2)} based on sections, skills, and red flags.",
        ]