def generate_candidate_summary(candidate):

    fit_score = candidate.fit_score or 0

    predicted_label = (
        candidate.predicted_label
        or "potential"
    )

    skill_score = candidate.skill_score or 0

    project_score = (
        candidate.project_relevance_score or 0
    )

    candidate_name = (
        candidate.candidate_name
        or "This candidate"
    )

    strengths = []

    if fit_score >= 80:
        strengths.append(
            "Strong overall technical alignment."
        )

    if skill_score >= 80:
        strengths.append(
            "Excellent required skill coverage."
        )

    if project_score >= 75:
        strengths.append(
            "Projects appear highly relevant."
        )

    if not strengths:
        strengths.append(
            "Candidate shows partial alignment."
        )

    risk = "Low"

    if fit_score < 70:
        risk = "Medium"

    if fit_score < 50:
        risk = "High"

    return {
        "summary":
            f"{candidate_name} appears to be a "
            f"{predicted_label} candidate.",

        "strengths": strengths,

        "risk_level": risk,

        "recommended_action":
            "Proceed to recruiter review."
    }