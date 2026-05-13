from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text

from app.db.database import Base


class RecruiterUser(Base):
    __tablename__ = "recruiter_users"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    email = Column(String(255), unique=True, index=True, nullable=False)

    full_name = Column(String(255), nullable=True)

    company_name = Column(String(255), nullable=True)

    hashed_password = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=True)


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    recruiter_id = Column(Integer, ForeignKey("recruiter_users.id"), nullable=True)

    candidate_name = Column(String(255), nullable=True)

    resume_filename = Column(String(255), nullable=True)

    fit_score = Column(Float, nullable=False)

    predicted_label = Column(String(50), nullable=False)

    semantic_similarity = Column(Float, nullable=False)

    matched_skills = Column(Text, nullable=False)

    missing_skills = Column(Text, nullable=False)

    recommendations = Column(Text, nullable=False)

    strengths = Column(Text, nullable=True)

    red_flags = Column(Text, nullable=True)

    score_explanation = Column(Text, nullable=True)

    hiring_recommendation = Column(Text, nullable=True)

    rewritten_resume = Column(Text, nullable=True)

    ats_score = Column(Float, nullable=True)

    skill_score = Column(Float, nullable=True)

    experience_score = Column(Float, nullable=True)

    confidence_score = Column(Float, nullable=True)

    project_relevance_score = Column(Float, nullable=True)

    seniority_match_score = Column(Float, nullable=True)

    category_scores = Column(Text, nullable=True)

    model_version = Column(String(100), nullable=True)

    share_id = Column(String(255), unique=True, nullable=True)

    recruiter_id = Column(Integer, nullable=True)

    candidate_status = Column(
        String(50),
        default="screening"
    )

    recruiter_notes = Column(
        Text,
        nullable=True
    )

    bookmarked = Column(Boolean, default=False)

    job_description = Column(Text, nullable=False)
