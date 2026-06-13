from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AnalysisRecord, JobCandidateLink, JobRequisition

router = APIRouter(
    prefix="/api/v1/job-requisitions",
    tags=["job candidates"],
)


def calculate_job_candidate_score(job: JobRequisition, candidate: AnalysisRecord) -> float:
    score = float(candidate.fit_score or 0)

    if candidate.ats_score:
        score = (score * 0.45) + (float(candidate.ats_score) * 0.25)

    if candidate.semantic_similarity:
        semantic_score = float(candidate.semantic_similarity)
        if semantic_score <= 1:
            semantic_score *= 100
        score += semantic_score * 0.2

    if candidate.skill_score:
        score += float(candidate.skill_score) * 0.1

    return round(min(score, 100), 2)


@router.post("/{job_id}/rank")
def rank_job_candidates(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = (
        db.query(JobRequisition)
        .filter(JobRequisition.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    candidates = (
        db.query(AnalysisRecord)
        .order_by(AnalysisRecord.fit_score.desc())
        .limit(25)
        .all()
    )

    ranked = []

    for candidate in candidates:
        score = calculate_job_candidate_score(job, candidate)

        existing = (
            db.query(JobCandidateLink)
            .filter(
                JobCandidateLink.job_id == job_id,
                JobCandidateLink.candidate_id == candidate.id,
            )
            .first()
        )

        notes = (
            f"Ranked against {job.title}. "
            f"Fit score: {candidate.fit_score}. "
            f"ATS score: {candidate.ats_score}. "
            f"Semantic similarity: {candidate.semantic_similarity}. "
            f"Prediction: {candidate.predicted_label}."
        )

        if existing:
            existing.ai_match_score = score
            existing.ranking_notes = notes
        else:
            link = JobCandidateLink(
                job_id=job_id,
                candidate_id=candidate.id,
                ai_match_score=score,
                ranking_notes=notes,
            )
            db.add(link)

        ranked.append(
            {
                "candidate_id": candidate.id,
                "candidate_name": candidate.candidate_name,
                "resume_filename": candidate.resume_filename,
                "fit_score": candidate.fit_score,
                "ai_match_score": score,
                "status": candidate.candidate_status,
                "bookmarked": candidate.bookmarked,
                "ranking_notes": notes,
            }
        )

    job.candidates_attached = len(ranked)

    db.commit()

    ranked.sort(
        key=lambda item: item["ai_match_score"],
        reverse=True,
    )

    return {
        "job_id": job_id,
        "job_title": job.title,
        "count": len(ranked),
        "ranked_candidates": ranked,
    }


@router.get("/{job_id}/candidates")
def list_job_candidates(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = (
        db.query(JobRequisition)
        .filter(JobRequisition.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    links = (
        db.query(JobCandidateLink, AnalysisRecord)
        .join(
            AnalysisRecord,
            JobCandidateLink.candidate_id == AnalysisRecord.id,
        )
        .filter(JobCandidateLink.job_id == job_id)
        .order_by(JobCandidateLink.ai_match_score.desc())
        .all()
    )

    return {
        "job_id": job_id,
        "job_title": job.title,
        "count": len(links),
        "candidates": [
            {
                "link_id": link.id,
                "candidate_id": candidate.id,
                "candidate_name": candidate.candidate_name,
                "resume_filename": candidate.resume_filename,
                "fit_score": candidate.fit_score,
                "ai_match_score": link.ai_match_score,
                "status": candidate.candidate_status,
                "bookmarked": candidate.bookmarked,
                "ranking_notes": link.ranking_notes,
            }
            for link, candidate in links
        ],
    }