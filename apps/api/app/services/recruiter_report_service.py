from __future__ import annotations


class RecruiterReportService:
    def build(
        self,
        fit_score: int,
        predicted_label: str,
        matched_skills: list[str],
        missing_skills: list[str],
        strengths: list[str],
        weaknesses: list[str],
    ) -> dict:
        if fit_score >= 80:
            recommendation = 'Strong screening candidate'
        elif fit_score >= 60:
            recommendation = 'Borderline but worth review'
        else:
            recommendation = 'Weak current match'

        summary = (
            f"Candidate is a {predicted_label} fit with a score of {fit_score}/100. "
            f"Strongest alignment appears in: {', '.join(matched_skills[:5]) if matched_skills else 'limited overlap'}. "
            f"Primary gaps: {', '.join(missing_skills[:5]) if missing_skills else 'no major gaps detected'}."
        )

        return {
            'summary': summary,
            'screening_recommendation': recommendation,
            'top_strengths': strengths[:5],
            'top_risks': weaknesses[:5] if weaknesses else ([f"Missing skills: {', '.join(missing_skills[:5])}"] if missing_skills else []),
        }
