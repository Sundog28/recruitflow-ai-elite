from pydantic import BaseModel
from typing import List, Optional


class AnalyzeResponse(BaseModel):
    fit_score: float
    predicted_label: str
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    recommendations: List[str]
    candidate_name: Optional[str] = None
    resume_filename: Optional[str] = None
    model_version: str


class HistoryItem(BaseModel):
    id: int
    created_at: str
    candidate_name: Optional[str]
    resume_filename: Optional[str]
    fit_score: float
    predicted_label: str
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[str]

    class Config:
        from_attributes = True
