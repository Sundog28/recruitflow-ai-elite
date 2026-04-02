from __future__ import annotations

import math
from functools import lru_cache


class SemanticSimilarityEngine:
    def __init__(self) -> None:
        self._model = self._load_model()

    @lru_cache(maxsize=1)
    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            return SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            return None

    def _fallback_similarity(self, a: str, b: str) -> float:
        tokens_a = set(a.lower().split())
        tokens_b = set(b.lower().split())
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = len(tokens_a & tokens_b)
        return intersection / math.sqrt(len(tokens_a) * len(tokens_b))

    def similarity(self, a: str, b: str) -> float:
        if self._model is None:
            return round(self._fallback_similarity(a, b), 4)
        embeddings = self._model.encode([a, b], normalize_embeddings=True)
        return float((embeddings[0] @ embeddings[1]).item())
