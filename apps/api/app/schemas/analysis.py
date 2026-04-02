from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    job_description: str = Field(min_length=20)


class AnalyzeResponse(BaseModel):
    fit_score: int
    predicted_label: str
    confidence: str
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    recruiter_summary: str
    model_version: str
    analysis_id: Optional[int] = None


class RankJobInput(BaseModel):
    title: str = Field(min_length=2)
    description: str = Field(min_length=20)


class RankRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    jobs: List[RankJobInput] = Field(min_length=1, max_length=10)


class RankedJobResponse(BaseModel):
    title: str
    fit_score: int
    predicted_label: str
    confidence: str
    semantic_similarity: float
    missing_skills: List[str]
    recruiter_summary: str


class RankResponse(BaseModel):
    jobs: List[RankedJobResponse]
    best_match_title: str


class ImproveBulletsRequest(BaseModel):
    bullets: List[str] = Field(min_length=1, max_length=10)
    target_role: str = Field(default='full-stack engineer', min_length=2)


class ImproveBulletsResponse(BaseModel):
    improvements: List[str]


class ATSOptimizeRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    job_description: str = Field(min_length=20)


class ATSOptimizeResponse(BaseModel):
    ats_score: float
    matched_keywords: List[str]
    missing_keywords: List[str]
    recommendations: List[str]


class RecruiterReportRequest(BaseModel):
    fit_score: int
    predicted_label: str
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]


class RecruiterReportResponse(BaseModel):
    summary: str
    screening_recommendation: str
    top_strengths: List[str]
    top_risks: List[str]


class HistoryItem(BaseModel):
    analysis_id: int
    created_at: str
    fit_score: int
    predicted_label: str
    semantic_similarity: float
    model_version: str
    top_missing_skills: List[str]


class HistoryResponse(BaseModel):
    items: List[HistoryItem]


class ModelInfoResponse(BaseModel):
    model_version: str
    model_type: str
    dataset_size: int
    accuracy: float
    feature_count: int
    inference_mode: str


class HealthResponse(BaseModel):
    status: str
