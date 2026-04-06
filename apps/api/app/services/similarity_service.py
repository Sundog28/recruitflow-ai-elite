from functools import lru_cache

from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

from app.config import get_settings


settings = get_settings()


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(settings.embedding_model)


class SimilarityService:
    @staticmethod
    def embedding_similarity(text_a: str, text_b: str) -> float:
        model = get_embedding_model()
        embeddings = model.encode([text_a, text_b])
        score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return round(float(score), 4)

    @staticmethod
    def token_overlap_similarity(text_a: str, text_b: str) -> float:
        a_tokens = set(text_a.split())
        b_tokens = set(text_b.split())

        if not a_tokens or not b_tokens:
            return 0.0

        intersection = a_tokens.intersection(b_tokens)
        union = a_tokens.union(b_tokens)
        return round(len(intersection) / len(union), 4)
