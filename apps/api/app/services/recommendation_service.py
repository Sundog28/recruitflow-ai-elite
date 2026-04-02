from __future__ import annotations

from app.services.scoring_service import ScoreOutput


class RecommendationService:
    def explain(self, result: ScoreOutput) -> tuple[list[str], list[str], list[str], str]:
        strengths: list[str] = []
        weaknesses: list[str] = []
        recommendations: list[str] = []

        if result.matched_skills:
            strengths.append(f"Matched core skills: {', '.join(result.matched_skills[:6])}")
        if result.semantic_similarity >= 0.72:
            strengths.append('Resume language is strongly aligned with the job description')
        if result.feature_vector['experience_score'] >= 1.0:
            strengths.append('Experience level meets or exceeds the stated requirement')
        if result.feature_vector['skill_overlap_ratio'] >= 0.6:
            strengths.append('Skill overlap is strong for this role')

        if result.missing_skills:
            weaknesses.append(f"Missing job keywords: {', '.join(result.missing_skills[:5])}")
            recommendations.append(f"Add or strengthen evidence for: {', '.join(result.missing_skills[:5])}")
        if result.semantic_similarity < 0.55:
            weaknesses.append('Resume wording is not closely aligned with this role')
            recommendations.append('Rewrite summary and top bullets using role-specific language from the job posting')
        if result.feature_vector['experience_score'] < 1.0:
            weaknesses.append('Experience appears below the requested level')
            recommendations.append('Highlight years of impact, ownership, and measurable project outcomes')
        if result.feature_vector['education_match'] < 1.0:
            recommendations.append('Include relevant coursework, certifications, or equivalent experience if no degree is listed')
        if not recommendations:
            recommendations.append('Keep the strongest matching projects near the top of the resume')

        recruiter_summary = self.recruiter_summary(result, strengths, weaknesses)
        return strengths or ['Broadly aligned technical background'], weaknesses or ['No major gaps detected from current analysis'], recommendations, recruiter_summary

    def recruiter_summary(self, result: ScoreOutput, strengths: list[str], weaknesses: list[str]) -> str:
        opening = 'Strong match' if result.fit_score >= 75 else 'Moderate match' if result.fit_score >= 55 else 'Weak match'
        matched = ', '.join(result.matched_skills[:4]) if result.matched_skills else 'limited matching keywords'
        missing = ', '.join(result.missing_skills[:3]) if result.missing_skills else 'no major missing skills detected'
        risk_line = weaknesses[0] if weaknesses else 'No major concerns surfaced from the current feature set.'
        return f"{opening} for screening. Candidate aligns best on {matched}. Main gap area: {missing}. Primary risk: {risk_line}"

    def improve_bullets(self, bullets: list[str], target_role: str) -> list[str]:
        improved: list[str] = []
        role_phrase = target_role.strip().lower()
        for bullet in bullets:
            raw = bullet.strip().rstrip('.')
            if not raw:
                continue
            lower = raw.lower()
            if lower.startswith('built '):
                improved.append(f"Developed {raw[6:]} for a {role_phrase} workflow, delivering production-ready functionality, clearer architecture, and measurable engineering value.")
            elif lower.startswith('made '):
                improved.append(f"Engineered {raw[5:]} to support {role_phrase} needs, with maintainable code, stronger technical scope, and user-facing impact.")
            else:
                improved.append(f"Led work that {raw[0].lower() + raw[1:]} while strengthening results for a {role_phrase} role through clearer technical ownership, tooling, and delivery impact.")
        return improved or ['Quantified impact, stack, and outcome for each bullet to make the experience more recruiter-friendly.']
