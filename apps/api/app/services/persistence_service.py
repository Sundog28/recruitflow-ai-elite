import json

from sqlalchemy.orm import Session

from app.db.models import AnalysisRun
from app.schemas.analysis import AnalyzeResponse, HistoryItem


class PersistenceService:
    def save(self, db: Session, request_resume: str, request_job: str, response: AnalyzeResponse) -> int:
        record = AnalysisRun(
            resume_text=request_resume,
            job_text=request_job,
            fit_score=response.fit_score,
            predicted_label=response.predicted_label,
            semantic_similarity=response.semantic_similarity,
            matched_skills_json=json.dumps(response.matched_skills),
            missing_skills_json=json.dumps(response.missing_skills),
            strengths_json=json.dumps(response.strengths),
            weaknesses_json=json.dumps(response.weaknesses),
            recommendations_json=json.dumps(response.recommendations),
            model_version=response.model_version,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return int(record.id)

    def list_history(self, db: Session, limit: int = 10) -> list[HistoryItem]:
        rows = db.query(AnalysisRun).order_by(AnalysisRun.id.desc()).limit(limit).all()
        items: list[HistoryItem] = []
        for row in rows:
            items.append(
                HistoryItem(
                    analysis_id=int(row.id),
                    created_at=str(row.created_at),
                    fit_score=int(round(row.fit_score)),
                    predicted_label=row.predicted_label,
                    semantic_similarity=round(float(row.semantic_similarity), 4),
                    model_version=row.model_version,
                    top_missing_skills=json.loads(row.missing_skills_json)[:3],
                )
            )
        return items
