from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobRequisitionCreate(BaseModel):
    title: str
    company_name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: str = "Full-time"
    workplace_type: str = "Remote"
    status: str = "open"
    priority: str = "medium"
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: str
    required_skills: Optional[str] = None
    nice_to_have_skills: Optional[str] = None
    target_seniority: Optional[str] = None
    hiring_manager: Optional[str] = None


class JobRequisitionUpdate(BaseModel):
    title: Optional[str] = None
    company_name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    workplace_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    nice_to_have_skills: Optional[str] = None
    target_seniority: Optional[str] = None
    hiring_manager: Optional[str] = None


class JobRequisitionResponse(BaseModel):
    id: int
    created_at: datetime
    recruiter_id: Optional[int] = None
    team_id: Optional[int] = None
    title: str
    company_name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: str
    workplace_type: str
    status: str
    priority: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: str
    required_skills: Optional[str] = None
    nice_to_have_skills: Optional[str] = None
    target_seniority: Optional[str] = None
    hiring_manager: Optional[str] = None
    candidates_attached: int

    class Config:
        from_attributes = True