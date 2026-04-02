from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import Iterable

import fitz

SKILL_ALIASES = {
    'js': 'javascript',
    'ts': 'typescript',
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'nodejs': 'node',
    'node.js': 'node',
    'sklearn': 'scikit-learn',
    'scikit learn': 'scikit-learn',
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'nextjs': 'next.js',
    'ci/cd': 'ci/cd',
}

SKILLS = {
    'python', 'javascript', 'typescript', 'react', 'node', 'go', 'fastapi', 'docker',
    'kubernetes', 'postgresql', 'mysql', 'mongodb', 'aws', 'azure', 'gcp', 'pandas',
    'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'sql', 'git', 'linux', 'tailwind',
    'vite', 'next.js', 'next', 'redis', 'graphql', 'rest', 'machine learning',
    'artificial intelligence', 'nlp', 'computer vision', 'ci/cd', 'github actions', 'pytest',
    'express', 'terraform', 'microservices', 'nginx', 'jwt', 'oauth', 'grpc'
}

EDUCATION_KEYWORDS = {'bachelor', 'bs', 'ba', 'master', 'ms', 'phd', 'associate'}
SENIORITY_ORDER = ['intern', 'junior', 'mid', 'senior', 'lead', 'staff', 'principal']


@dataclass
class ParsedText:
    raw_text: str
    normalized_text: str
    skills: list[str]
    years_experience: int
    education_keywords: list[str]
    seniority: str


class ParserService:
    def normalize_text(self, text: str) -> str:
        return re.sub(r'\s+', ' ', text.lower()).strip()

    def normalize_skill(self, value: str) -> str:
        value = value.lower().strip()
        return SKILL_ALIASES.get(value, value)

    def extract_pdf_text(self, data: bytes) -> str:
        with fitz.open(stream=io.BytesIO(data), filetype='pdf') as doc:
            return '\n'.join(page.get_text() for page in doc)

    def extract_skills(self, text: str) -> list[str]:
        normalized = self.normalize_text(text)
        found = set()
        for raw_skill in SKILLS.union(SKILL_ALIASES.keys()):
            pattern = rf'(?<!\w){re.escape(raw_skill)}(?!\w)'
            if re.search(pattern, normalized):
                found.add(self.normalize_skill(raw_skill))
        return sorted(found)

    def extract_years_experience(self, text: str) -> int:
        normalized = self.normalize_text(text)
        patterns = [
            r'(\d+)\+?\s+years? of experience',
            r'(\d+)\+?\s+years? experience',
            r'experience of (\d+)\+? years?',
        ]
        values: list[int] = []
        for pattern in patterns:
            values.extend(int(match) for match in re.findall(pattern, normalized))
        return max(values) if values else 0

    def extract_education(self, text: str) -> list[str]:
        normalized = self.normalize_text(text)
        return sorted([kw for kw in EDUCATION_KEYWORDS if kw in normalized])

    def extract_seniority(self, text: str) -> str:
        normalized = self.normalize_text(text)
        for level in reversed(SENIORITY_ORDER):
            if re.search(rf'(?<!\w){level}(?!\w)', normalized):
                return level
        return 'mid'

    def parse(self, text: str) -> ParsedText:
        normalized = self.normalize_text(text)
        return ParsedText(
            raw_text=text,
            normalized_text=normalized,
            skills=self.extract_skills(text),
            years_experience=self.extract_years_experience(text),
            education_keywords=self.extract_education(text),
            seniority=self.extract_seniority(text),
        )

    def overlap(self, a: Iterable[str], b: Iterable[str]) -> tuple[list[str], list[str]]:
        set_a, set_b = set(a), set(b)
        matched = sorted(set_a & set_b)
        missing = sorted(set_b - set_a)
        return matched, missing
