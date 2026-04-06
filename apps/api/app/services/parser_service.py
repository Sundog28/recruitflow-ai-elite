import re
from pathlib import Path
from typing import Dict, List

from docx import Document
from pypdf import PdfReader


KNOWN_SKILLS = sorted(set([
    "python", "fastapi", "flask", "django", "sql", "postgresql", "mysql", "sqlite",
    "docker", "kubernetes", "aws", "azure", "gcp", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "machine learning", "deep learning", "nlp", "llm",
    "react", "typescript", "javascript", "node", "git", "github", "redis",
    "celery", "mlflow", "airflow", "ci/cd", "linux", "rest api", "graphql",
    "data analysis", "feature engineering", "model deployment", "prompt engineering",
    "rag", "vector database", "postgres", "tailwind", "vite", "power bi"
]))


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\+\#\.\-\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_candidate_name(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return None

    first = lines[0]
    if len(first.split()) <= 5 and len(first) < 50 and "resume" not in first.lower():
        return first
    return None


def extract_skills(text: str) -> List[str]:
    normalized = normalize_text(text)
    found: List[str] = []

    for skill in KNOWN_SKILLS:
        if skill in normalized:
            found.append(skill)

    return sorted(set(found))


def count_years_signals(text: str) -> int:
    normalized = normalize_text(text)
    patterns = re.findall(r"(\d+)\+?\s+years", normalized)
    if not patterns:
        return 0
    try:
        return max(int(x) for x in patterns)
    except Exception:
        return 0


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
        "years_signal": count_years_signals(text),
        "normalized_text": normalize_text(text),
    }


def parse_job_description(text: str) -> Dict:
    return {
        "skills": extract_skills(text),
        "years_signal": count_years_signals(text),
        "normalized_text": normalize_text(text),
    }
