def safe_value(value, fallback):
    if value is None:
        return fallback
    return value


def generate_candidate_summary(candidate):
    candidate_name = safe_value(
        candidate.candidate_name,
        "This candidate"
    )

    predicted_label = safe_value(
        candidate.predicted_label,
        "potential match"
    )

    fit_score = safe_value(
        candidate.fit_score,
        0
    )

    skill_score = safe_value(
        candidate.skill_score,
        0
    )

    project_score = safe_value(
        candidate.project_relevance_score,
        0
    )

    strengths = []

    if fit_score >= 80:
        strengths.append("Strong overall technical alignment.")

    if skill_score >= 80:
        strengths.append("Excellent required skill coverage.")

    if project_score >= 75:
        strengths.append("Projects appear highly relevant.")

    if not strengths:
        strengths.append("Candidate shows partial alignment.")

    risk_level = "Low"

    if fit_score < 70:
        risk_level = "Medium"

    if fit_score < 50:
        risk_level = "High"

    return {
        "summary": (
            f"{candidate_name} appears to be a "
            f"{predicted_label} candidate."
        ),
        "strengths": strengths,
        "risk_level": risk_level,
        "recommended_action": "Proceed to recruiter review.",
        "fit_score": fit_score,
        "skill_score": skill_score,
        "project_relevance_score": project_score,
    }