from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from datetime import datetime

from app.db.database import Base


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    candidate_name = Column(String(255), nullable=True)
    resume_filename = Column(String(255), nullable=True)
    fit_score = Column(Float, nullable=False)
    predicted_label = Column(String(50), nullable=False)
    semantic_similarity = Column(Float, nullable=False)
    matched_skills = Column(Text, nullable=False)
    missing_skills = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    job_description = Column(Text, nullable=False)
