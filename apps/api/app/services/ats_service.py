from __future__ import annotations

import re


class ATSService:
    STOPWORDS = {
        'the', 'and', 'for', 'with', 'you', 'are', 'our', 'this', 'that',
        'will', 'have', 'from', 'your', 'into', 'using', 'their', 'they',
        'about', 'years', 'year', 'preferred', 'need', 'needs', 'role',
        'candidate', 'experience', 'work', 'team', 'build', 'built'
    }

    def optimize(self, resume_text: str, job_text: str) -> dict:
        resume_words = set(re.findall(r"\b[a-zA-Z][a-zA-Z0-9+\-#.]*\b", resume_text.lower()))
        job_words = set(re.findall(r"\b[a-zA-Z][a-zA-Z0-9+\-#.]*\b", job_text.lower()))

        important = {
            word for word in job_words
            if len(word) > 2 and word not in self.STOPWORDS
        }

        matched = sorted(important & resume_words)
        missing = sorted(important - resume_words)
        coverage = round((len(matched) / len(important)) * 100, 1) if important else 0.0

        recommendations: list[str] = []
        if missing:
            recommendations.append(f"Add or strengthen these keywords where truthful: {', '.join(missing[:10])}")
        if coverage < 60:
            recommendations.append('Keyword coverage is low. Align project bullets and technical stack language more closely.')
        elif coverage < 80:
            recommendations.append('Keyword coverage is moderate. Add stronger job-specific terminology.')
        else:
            recommendations.append('Keyword coverage is strong.')

        return {
            'ats_score': coverage,
            'matched_keywords': matched,
            'missing_keywords': missing,
            'recommendations': recommendations,
        }
