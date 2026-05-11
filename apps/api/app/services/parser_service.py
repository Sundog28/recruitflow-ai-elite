import re
from pathlib import Path
from typing import Dict, List

from docx import Document
from pypdf import PdfReader


SKILL_CATEGORIES = {
    "backend": [
        "python", "fastapi", "flask", "django", "node", "rest api", "graphql",
        "sql", "postgresql", "postgres", "mysql", "sqlite", "redis", "celery",
    ],
    "frontend": [
        "react", "typescript", "javascript", "tailwind", "vite", "html", "css",
    ],
    "ml_ai": [
        "machine learning", "deep learning", "nlp", "llm", "rag", "prompt engineering",
        "vector database", "feature engineering", "model deployment", "mlflow",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    ],
    "cloud_devops": [
        "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "linux",
        "github", "git", "render", "vercel",
    ],
    "analytics": [
        "data analysis", "power bi", "airflow",
    ],
}

KNOWN_SKILLS = sorted({skill for skills in SKILL_CATEGORIES.values() for skill in skills})

SENIORITY_TERMS = {
    "entry": ["junior", "entry level", "intern", "associate"],
    "mid": ["mid level", "mid-level", "software engineer", "developer"],
    "senior": ["senior", "lead", "principal", "staff", "architect"],
}

SECTION_ALIASES = {
    "summary": ["summary", "professional summary", "profile"],
    "skills": ["skills", "technical skills", "core skills", "technologies"],
    "experience": ["experience", "work experience", "professional experience", "employment"],
    "projects": ["projects", "technical projects", "portfolio"],
    "education": ["education", "certifications", "training"],
}


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\+\#\.\-\s/]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_candidate_name(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return None

    first = lines[0]
    bad_words = ["resume", "curriculum", "profile", "summary"]

    if len(first.split()) <= 5 and len(first) < 60 and not any(w in first.lower() for w in bad_words):
        return first

    return None


def extract_skills(text: str) -> List[str]:
    normalized = normalize_text(text)
    found: List[str] = []

    for skill in KNOWN_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, normalized):
            found.append(skill)

    return sorted(set(found))


def extract_skill_categories(text: str) -> Dict[str, List[str]]:
    skills = set(extract_skills(text))
    return {
        category: sorted(skills.intersection(set(category_skills)))
        for category, category_skills in SKILL_CATEGORIES.items()
    }


def count_years_signals(text: str) -> int:
    normalized = normalize_text(text)
    patterns = re.findall(r"(\d+)\+?\s+years", normalized)
    if not patterns:
        return 0

    try:
        return max(int(x) for x in patterns)
    except Exception:
        return 0


def detect_seniority(text: str) -> str:
    normalized = normalize_text(text)

    for level, terms in SENIORITY_TERMS.items():
        if any(term in normalized for term in terms):
            return level

    years = count_years_signals(text)

    if years >= 7:
        return "senior"
    if years >= 2:
        return "mid"
    return "entry"


def detect_resume_sections(text: str) -> Dict[str, bool]:
    normalized_lines = [normalize_text(line) for line in text.splitlines() if line.strip()]
    found = {}

    for section, aliases in SECTION_ALIASES.items():
        found[section] = any(
            any(alias == line or line.startswith(alias + " ") for alias in aliases)
            for line in normalized_lines
        )

    return found


def extract_project_lines(text: str) -> List[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    project_lines = []

    project_keywords = [
        "built", "created", "developed", "deployed", "implemented",
        "designed", "integrated", "optimized", "automated", "project",
    ]

    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in project_keywords):
            project_lines.append(line)

    return project_lines[:12]


def calculate_project_relevance(text: str, job_text: str) -> float:
    project_lines = extract_project_lines(text)
    if not project_lines:
        return 0.0

    project_text = normalize_text(" ".join(project_lines))
    job_skills = extract_skills(job_text)

    if not job_skills:
        return 0.5

    matched = sum(1 for skill in job_skills if skill in project_text)
    return round(min(matched / max(len(job_skills), 1), 1.0), 4)


def detect_red_flags(text: str) -> List[str]:
    red_flags: List[str] = []
    sections = detect_resume_sections(text)
    skills = extract_skills(text)

    if not sections.get("skills"):
        red_flags.append("Resume may be missing a clearly labeled skills section.")

    if not sections.get("projects") and not sections.get("experience"):
        red_flags.append("Resume may be missing strong project or experience evidence.")

    if len(skills) < 4:
        red_flags.append("Resume has limited detected technical skills.")

    if not re.search(r"\d+%|\$\d+|\d+x|\d+\+", text.lower()):
        red_flags.append("Resume has few quantified achievements or measurable outcomes.")

    if len(text.split()) < 120:
        red_flags.append("Resume appears short and may lack enough detail for strong ATS matching.")

    return red_flags


def read_txt_bytes(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


def read_pdf_bytes(content: bytes, temp_path: str) -> str:
    with open(temp_path, "wb") as f:
        f.write(content)

    reader = PdfReader(temp_path)
    pages = []

    for page in reader.pages:
        pages.append(page.extract_text() or "")

    return "\n".join(pages).strip()


def read_docx_bytes(content: bytes, temp_path: str) -> str:
    with open(temp_path, "wb") as f:
        f.write(content)

    doc = Document(temp_path)
    return "\n".join(p.text for p in doc.paragraphs).strip()


def extract_resume_text(filename: str, content: bytes, upload_dir: str) -> str:
    ext = Path(filename).suffix.lower()
    temp_path = str(Path(upload_dir) / filename)

    if ext == ".txt":
        return read_txt_bytes(content)

    if ext == ".pdf":
        return read_pdf_bytes(content, temp_path)

    if ext == ".docx":
        return read_docx_bytes(content, temp_path)

    raise ValueError(f"Unsupported file type: {ext}. Use .txt, .pdf, or .docx")


def parse_resume(text: str) -> Dict:
    return {
        "candidate_name": extract_candidate_name(text),
        "skills": extract_skills(text),
        "skill_categories": extract_skill_categories(text),
        "years_signal": count_years_signals(text),
        "seniority": detect_seniority(text),
        "sections": detect_resume_sections(text),
        "project_lines": extract_project_lines(text),
        "red_flags": detect_red_flags(text),
        "normalized_text": normalize_text(text),
    }


def parse_job_description(text: str) -> Dict:
    return {
        "skills": extract_skills(text),
        "skill_categories": extract_skill_categories(text),
        "years_signal": count_years_signals(text),
        "seniority": detect_seniority(text),
        "normalized_text": normalize_text(text),
        "raw_text": text,
    }