import re
from functools import lru_cache

import numpy as np


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def lexical_similarity(job_text: str, resume_text: str) -> float:
    job_tokens = set(re.findall(r"[a-zA-Z][a-zA-Z0-9+/.-]*", normalize_text(job_text)))
    resume_tokens = set(re.findall(r"[a-zA-Z][a-zA-Z0-9+/.-]*", normalize_text(resume_text)))

    if not job_tokens or not resume_tokens:
        return 0.2

    overlap = len(job_tokens & resume_tokens)
    union = len(job_tokens | resume_tokens)
    score = overlap / union if union else 0.0
    return round(max(0.2, min(0.85, score + 0.15)), 4)


@lru_cache(maxsize=1)
def get_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("all-MiniLM-L6-v2")


def semantic_similarity(job_text: str, resume_text: str) -> tuple[float, str]:
    try:
        model = get_model()
        embeddings = model.encode([job_text, resume_text], normalize_embeddings=True)
        score = float(np.dot(embeddings[0], embeddings[1]))
        score = round(max(0.2, min(0.99, score)), 4)
        return score, "ml-semantic-v1"
    except Exception:
        return lexical_similarity(job_text, resume_text), "fallback-lexical-v1"
