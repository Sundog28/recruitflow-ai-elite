from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


class EmbeddingService:
    @staticmethod
    def similarity(text_a: str, text_b: str) -> float:
        if not text_a.strip() or not text_b.strip():
            return 0.0

        model = get_embedding_model()
        embeddings = model.encode([text_a, text_b], normalize_embeddings=True)

        score = float(np.dot(embeddings[0], embeddings[1]))

        return round(max(0.0, min(score, 1.0)), 4)