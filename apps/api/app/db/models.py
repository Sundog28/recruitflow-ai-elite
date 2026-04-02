from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resume_text: Mapped[str] = mapped_column(Text)
    job_text: Mapped[str] = mapped_column(Text)
    fit_score: Mapped[float] = mapped_column(Float)
    predicted_label: Mapped[str] = mapped_column(String(64))
    semantic_similarity: Mapped[float] = mapped_column(Float)
    matched_skills_json: Mapped[str] = mapped_column(Text)
    missing_skills_json: Mapped[str] = mapped_column(Text)
    strengths_json: Mapped[str] = mapped_column(Text)
    weaknesses_json: Mapped[str] = mapped_column(Text)
    recommendations_json: Mapped[str] = mapped_column(Text)
    model_version: Mapped[str] = mapped_column(String(64), default="heuristic-v1")
