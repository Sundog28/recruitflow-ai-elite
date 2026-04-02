from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from app.config import get_settings
from app.services.parser_service import ParserService
from ml.features.feature_engineering import build_feature_vector
from ml.features.semantic import SemanticSimilarityEngine


@dataclass
class ScoreOutput:
    fit_score: int
    predicted_label: str
    confidence: str
    semantic_similarity: float
    matched_skills: list[str]
    missing_skills: list[str]
    feature_vector: dict[str, float]
    model_version: str


class ScoringService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.parser = ParserService()
        self.semantic_engine = SemanticSimilarityEngine()
        self.model: Any | None = None
        self.feature_names: list[str] | None = None
        self.model_version = 'heuristic-v1'
        self.model_type = 'weighted-rule-engine'
        self.dataset_size = 0
        self.accuracy = 0.0
        self._load_model()

    def _load_model(self) -> None:
        model_path = Path(self.settings.model_path)
        if model_path.exists():
            payload = joblib.load(model_path)
            self.model = payload['model']
            self.feature_names = payload.get('feature_names')
            self.model_version = payload.get('version', 'trained-v1')
            self.model_type = payload.get('model_type', type(self.model).__name__)
            self.dataset_size = int(payload.get('dataset_size', 0))
            self.accuracy = float(payload.get('accuracy', 0.0))

    def get_model_info(self) -> dict[str, Any]:
        return {
            'model_version': self.model_version,
            'model_type': self.model_type,
            'dataset_size': self.dataset_size,
            'accuracy': round(self.accuracy, 4),
            'feature_count': len(self.feature_names or []),
            'inference_mode': 'trained' if self.model is not None else 'heuristic',
        }

    def _confidence_from_score(self, score: int) -> str:
        if score >= 80:
            return 'high'
        if score >= 60:
            return 'medium'
        return 'low'

    def score(self, resume_text: str, job_text: str) -> ScoreOutput:
        parsed_resume = self.parser.parse(resume_text)
        parsed_job = self.parser.parse(job_text)
        matched_skills, missing_skills = self.parser.overlap(parsed_resume.skills, parsed_job.skills)
        semantic_similarity = self.semantic_engine.similarity(resume_text, job_text)
        feature_vector = build_feature_vector(parsed_resume, parsed_job, matched_skills, missing_skills, semantic_similarity)

        if self.model is not None:
            names = self.feature_names or sorted(feature_vector)
            ordered = np.array([[feature_vector[key] for key in names]])
            probs = self.model.predict_proba(ordered)[0]
            prediction = int(np.argmax(probs))
            label_map = {0: 'low', 1: 'medium', 2: 'high'}
            predicted_label = label_map[prediction]
            fit_score = int(round((probs[1] * 0.45 + probs[2] * 1.0) * 100))
        else:
            skill_overlap_ratio = feature_vector['skill_overlap_ratio']
            experience_score = feature_vector['experience_score']
            seniority_score = feature_vector['seniority_match']
            education_score = feature_vector['education_match']
            weighted = (
                semantic_similarity * 0.40
                + skill_overlap_ratio * 0.35
                + experience_score * 0.15
                + seniority_score * 0.05
                + education_score * 0.05
            )
            fit_score = int(round(weighted * 100))
            if fit_score >= 75:
                predicted_label = 'high'
            elif fit_score >= 50:
                predicted_label = 'medium'
            else:
                predicted_label = 'low'

        fit_score = max(0, min(100, fit_score))
        confidence = self._confidence_from_score(fit_score)

        return ScoreOutput(
            fit_score=fit_score,
            predicted_label=predicted_label,
            confidence=confidence,
            semantic_similarity=round(float(semantic_similarity), 4),
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            feature_vector=feature_vector,
            model_version=self.model_version,
        )
