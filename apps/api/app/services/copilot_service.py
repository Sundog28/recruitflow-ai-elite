def generate_candidate_summary(candidate):

    strengths = []

    if candidate.fit_score >= 80:
        strengths.append(
            "Strong overall technical alignment."
        )

    if candidate.skill_score and candidate.skill_score >= 80:
        strengths.append(
            "Excellent required skill coverage."
        )

    if candidate.project_relevance_score and candidate.project_relevance_score >= 75:
        strengths.append(
            "Projects appear highly relevant."
        )

    if not strengths:
        strengths.append(
            "Candidate shows partial alignment."
        )

    risk = "Low"

    if candidate.fit_score < 70:
        risk = "Medium"

    if candidate.fit_score < 50:
        risk = "High"

    return {
        "summary":
            f"{candidate.candidate_name} appears to be a "
            f"{candidate.predicted_label} candidate.",

        "strengths": strengths,

        "risk_level": risk,

        "recommended_action":
            "Proceed to recruiter review."
    }