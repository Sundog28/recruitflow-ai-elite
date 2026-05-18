from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model():
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def build_candidate_embedding_text(candidate) -> str:
    return " ".join(
        [
            candidate.candidate_name or "",
            candidate.resume_filename or "",
            candidate.matched_skills or "",
            candidate.missing_skills or "",
            candidate.strengths or "",
            candidate.red_flags or "",
            candidate.hiring_recommendation or "",
            candidate.score_explanation or "",
            candidate.recruiter_notes or "",
            candidate.candidate_tags or "",
            candidate.job_description or "",
        ]
    ).strip()


def generate_embedding(text: str) -> List[float]:
    model = get_embedding_model()

    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )

    return embedding.tolist()


def generate_candidate_embedding(candidate) -> dict:
    embedding_text = build_candidate_embedding_text(candidate)

    if not embedding_text:
        embedding_text = "empty candidate profile"

    embedding = generate_embedding(embedding_text)

    return {
        "embedding_text": embedding_text,
        "embedding_model": EMBEDDING_MODEL_NAME,
        "candidate_embedding": embedding,
    }


def cosine_similarity(
    vector_a: List[float],
    vector_b: List[float],
) -> float:
    if not vector_a or not vector_b:
        return 0.0

    dot_product = sum(a * b for a, b in zip(vector_a, vector_b))

    magnitude_a = sum(a * a for a in vector_a) ** 0.5
    magnitude_b = sum(b * b for b in vector_b) ** 0.5

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)