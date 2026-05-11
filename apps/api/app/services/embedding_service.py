from difflib import SequenceMatcher


class EmbeddingService:
    @staticmethod
    def similarity(text_a: str, text_b: str) -> float:
        if not text_a.strip() or not text_b.strip():
            return 0.0

        score = SequenceMatcher(
            None,
            text_a.lower(),
            text_b.lower(),
        ).ratio()

        return round(score, 4)