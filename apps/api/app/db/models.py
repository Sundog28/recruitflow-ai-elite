from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text

from pgvector.sqlalchemy import Vector

from app.db.database import Base


class RecruiterTeam(Base):
    __tablename__ = "recruiter_teams"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team_name = Column(String(255), nullable=False)
    owner_id = Column(Integer, nullable=True)

class RecruiterInvitation(Base):
    __tablename__ = "recruiter_invitations"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    email = Column(
        String(255),
        nullable=False,
        index=True,
    )

    invited_by_user_id = Column(
        Integer,
        ForeignKey("recruiter_users.id"),
        nullable=True,
    )

    team_id = Column(
        Integer,
        ForeignKey("recruiter_teams.id"),
        nullable=False,
    )

    role = Column(
        String(50),
        default="recruiter",
    )

    invitation_token = Column(
        String(255),
        unique=True,
        nullable=False,
    )

    status = Column(
        String(50),
        default="pending",
    )

    accepted_at = Column(
        DateTime,
        nullable=True,
    )

class TeamCandidateComment(Base):
    __tablename__ = "team_candidate_comments"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    team_id = Column(
        Integer,
        ForeignKey("recruiter_teams.id"),
        nullable=False,
    )

    candidate_id = Column(
        Integer,
        ForeignKey("analysis_records.id"),
        nullable=False,
    )

    recruiter_user_id = Column(
        Integer,
        ForeignKey("recruiter_users.id"),
        nullable=True,
    )

    comment = Column(Text, nullable=False)

    visibility = Column(
        String(50),
        default="team",
    )

class TeamRolePermission(Base):
    __tablename__ = "team_role_permissions"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    role_name = Column(
        String(50),
        nullable=False,
        unique=True,
    )

    can_manage_team = Column(Boolean, default=False)
    can_manage_candidates = Column(Boolean, default=False)
    can_leave_comments = Column(Boolean, default=True)
    can_view_pipeline = Column(Boolean, default=True)
    can_manage_billing = Column(Boolean, default=False)
    can_invite_recruiters = Column(Boolean, default=False)


class TeamAuditLog(Base):
    __tablename__ = "team_audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    team_id = Column(
        Integer,
        ForeignKey("recruiter_teams.id"),
        nullable=False,
    )

    recruiter_user_id = Column(
        Integer,
        ForeignKey("recruiter_users.id"),
        nullable=True,
    )

    action_type = Column(
        String(100),
        nullable=False,
    )

    target_type = Column(
        String(100),
        nullable=True,
    )

    target_id = Column(
        Integer,
        nullable=True,
    )

    action_summary = Column(
        Text,
        nullable=False,
    )

    metadata_json = Column(
        Text,
        nullable=True,
    )
    
class RecruiterUser(Base):
    __tablename__ = "recruiter_users"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)

    subscription_status = Column(String(50), default="free")
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)

    plan_name = Column(String(100), default="free")
    plan = Column(String(50), default="free")

    team_id = Column(
        Integer,
        ForeignKey("recruiter_teams.id"),
        nullable=True,
    )

    role = Column(String(50), default="recruiter")

    analysis_count = Column(Integer, default=0)
    analyses_used = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    recruiter_id = Column(
        Integer,
        ForeignKey("recruiter_users.id"),
        nullable=True,
    )

    team_id = Column(
        Integer,
        ForeignKey("recruiter_teams.id"),
        nullable=True,
    )

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

    candidate_status = Column(String(50), default="screening")
    recruiter_notes = Column(Text, nullable=True)
    candidate_tags = Column(Text, nullable=True)
    bookmarked = Column(Boolean, default=False)

    job_description = Column(Text, nullable=False)

    embedding_text = Column(Text, nullable=True)
    embedding_model = Column(String(100), nullable=True)

    # all-MiniLM-L6-v2 creates 384-dimensional vectors.
    # Later, if we switch to OpenAI text-embedding-3-small,
    # this should become Vector(1536).
    candidate_embedding = Column(Vector(384), nullable=True)