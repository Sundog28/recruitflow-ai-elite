import os
from typing import List

from openai import OpenAI


EMBEDDING_MODEL_NAME = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 384

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    api_key=OPENAI_API_KEY,
)


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
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Cannot generate embeddings."
        )

    if not text.strip():
        text = "empty candidate profile"

    response = client.embeddings.create(
        model=EMBEDDING_MODEL_NAME,
        input=text,
        dimensions=EMBEDDING_DIMENSIONS,
    )

    return response.data[0].embedding


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