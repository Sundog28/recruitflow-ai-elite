from __future__ import annotations

import csv
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from app.services.parser_service import ParserService
from ml.features.feature_engineering import build_feature_vector
from ml.features.semantic import SemanticSimilarityEngine

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / 'data' / 'labeled' / 'training_pairs.csv'
MODEL_DIR = ROOT / 'ml' / 'models'
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / 'fit_model.joblib'


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline='', encoding='utf-8') as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    parser = ParserService()
    semantic = SemanticSimilarityEngine()
    rows = load_rows(DATA_PATH)

    feature_names: list[str] | None = None
    X, y = [], []
    label_map = {'low': 0, 'medium': 1, 'high': 2}

    for row in rows:
        parsed_resume = parser.parse(row['resume_text'])
        parsed_job = parser.parse(row['job_description'])
        matched, missing = parser.overlap(parsed_resume.skills, parsed_job.skills)
        similarity = semantic.similarity(row['resume_text'], row['job_description'])
        features = build_feature_vector(parsed_resume, parsed_job, matched, missing, similarity)
        if feature_names is None:
            feature_names = sorted(features)
        X.append([features[name] for name in feature_names])
        y.append(label_map[row['fit_label']])

    X_np = np.array(X)
    y_np = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(X_np, y_np, test_size=0.25, random_state=42, stratify=y_np)
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(classification_report(y_test, predictions))

    joblib.dump(
        {
            'model': model,
            'version': 'rf-v2',
            'feature_names': feature_names,
            'dataset_size': len(rows),
            'accuracy': float(accuracy),
            'model_type': 'RandomForestClassifier',
        },
        MODEL_PATH,
    )
    print(f'Saved model to {MODEL_PATH}')


if __name__ == '__main__':
    main()
