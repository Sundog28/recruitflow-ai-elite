from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import JobRequisition
from app.schemas.job_requisitions import (
    JobRequisitionCreate,
    JobRequisitionResponse,
    JobRequisitionUpdate,
)

router = APIRouter(
    prefix="/api/v1/job-requisitions",
    tags=["job requisitions"],
)


@router.get("", response_model=List[JobRequisitionResponse])
def list_job_requisitions(db: Session = Depends(get_db)):
    jobs = (
        db.query(JobRequisition)
        .order_by(JobRequisition.created_at.desc())
        .all()
    )

    return jobs


@router.post("", response_model=JobRequisitionResponse)
def create_job_requisition(
    payload: JobRequisitionCreate,
    db: Session = Depends(get_db),
):
    job = JobRequisition(
        recruiter_id=1,
        team_id=1,
        title=payload.title,
        company_name=payload.company_name,
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        workplace_type=payload.workplace_type,
        status=payload.status,
        priority=payload.priority,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        description=payload.description,
        required_skills=payload.required_skills,
        nice_to_have_skills=payload.nice_to_have_skills,
        target_seniority=payload.target_seniority,
        hiring_manager=payload.hiring_manager,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get("/{job_id}", response_model=JobRequisitionResponse)
def get_job_requisition(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = (
        db.query(JobRequisition)
        .filter(JobRequisition.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job requisition not found.",
        )

    return job


@router.patch("/{job_id}", response_model=JobRequisitionResponse)
def update_job_requisition(
    job_id: int,
    payload: JobRequisitionUpdate,
    db: Session = Depends(get_db),
):
    job = (
        db.query(JobRequisition)
        .filter(JobRequisition.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job requisition not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)

    return job


@router.delete("/{job_id}")
def delete_job_requisition(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = (
        db.query(JobRequisition)
        .filter(JobRequisition.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job requisition not found.",
        )

    db.delete(job)
    db.commit()

    return {
        "status": "deleted",
        "job_id": job_id,
    }