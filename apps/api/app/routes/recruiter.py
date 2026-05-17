from fastapi import APIRouter
from fastapi import Form
from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

router = APIRouter(
    prefix="/api/v1/recruiter",
    tags=["recruiter"],
)

VALID_STATUSES = {
    "screening",
    "interview",
    "offer",
    "hired",
    "rejected",
}


def serialize_candidate(analysis: AnalysisRecord):
    return {
        "id": analysis.id,
        "candidate_name": analysis.candidate_name,
        "resume_filename": analysis.resume_filename,
        "fit_score": analysis.fit_score,
        "status": analysis.candidate_status or "screening",
        "bookmarked": bool(analysis.bookmarked),
        "created_at": analysis.created_at.isoformat(),
        "recommendation": analysis.hiring_recommendation,
        "notes": analysis.recruiter_notes or "",
        "tags": analysis.candidate_tags or "",
    }


@router.get("/dashboard")
def recruiter_dashboard():
    db: Session = SessionLocal()

    try:
        analyses = (
            db.query(AnalysisRecord)
            .order_by(desc(AnalysisRecord.created_at))
            .limit(25)
            .all()
        )

        total_candidates = len(analyses)
        bookmarked_candidates = len([a for a in analyses if a.bookmarked])

        average_fit_score = 0
        if analyses:
            average_fit_score = round(
                sum(a.fit_score for a in analyses) / len(analyses),
                2,
            )

        pipeline = {
            "screening": 0,
            "interview": 0,
            "offer": 0,
            "hired": 0,
            "rejected": 0,
        }

        recent_candidates = []

        for analysis in analyses:
            status = analysis.candidate_status or "screening"

            if status not in pipeline:
                pipeline[status] = 0

            pipeline[status] += 1
            recent_candidates.append(serialize_candidate(analysis))

        return {
            "total_candidates": total_candidates,
            "bookmarked_candidates": bookmarked_candidates,
            "average_fit_score": average_fit_score,
            "pipeline": pipeline,
            "recent_candidates": recent_candidates,
        }

    finally:
        db.close()


@router.get("/search")
def recruiter_search(
    status: str | None = None,
    min_score: float | None = None,
    bookmarked: bool | None = None,
):
    db: Session = SessionLocal()

    try:
        query = db.query(AnalysisRecord)

        if status:
            query = query.filter(AnalysisRecord.candidate_status == status)

        if min_score is not None:
            query = query.filter(AnalysisRecord.fit_score >= min_score)

        if bookmarked is not None:
            query = query.filter(AnalysisRecord.bookmarked == bookmarked)

        results = (
            query.order_by(desc(AnalysisRecord.created_at))
            .limit(100)
            .all()
        )

        return {
            "count": len(results),
            "results": [serialize_candidate(r) for r in results],
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int,
    status: str = Form(...),
):
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate status.",
        )

    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.candidate_status = status

        db.commit()
        db.refresh(analysis)

        return {
            "message": "Candidate status updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/bookmark")
def toggle_candidate_bookmark(candidate_id: int):
    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.bookmarked = not bool(analysis.bookmarked)

        db.commit()
        db.refresh(analysis)

        return {
            "message": "Candidate bookmark updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/notes")
def update_candidate_notes(
    candidate_id: int,
    notes: str = Form(""),
):
    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.recruiter_notes = notes

        db.commit()
        db.refresh(analysis)

        return {
            "message": "Recruiter notes updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()


@router.patch("/candidates/{candidate_id}/tags")
def update_candidate_tags(
    candidate_id: int,
    tags: str = Form(""),
):
    db: Session = SessionLocal()

    try:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        analysis.candidate_tags = tags

        db.commit()
        db.refresh(analysis)

        return {
            "message": "Candidate tags updated.",
            "candidate": serialize_candidate(analysis),
        }

    finally:
        db.close()

@router.get("/semantic-search")
def semantic_candidate_search(
    query: str,
):
    db: Session = SessionLocal()

    try:
        analyses = (
            db.query(AnalysisRecord)
            .order_by(desc(AnalysisRecord.fit_score))
            .limit(100)
            .all()
        )

        query_lower = query.lower()

        scored_results = []

        for analysis in analyses:
            searchable_text = " ".join(
                [
                    analysis.candidate_name or "",
                    analysis.resume_filename or "",
                    analysis.matched_skills or "",
                    analysis.missing_skills or "",
                    analysis.hiring_recommendation or "",
                    analysis.predicted_label or "",
                    analysis.recruiter_notes or "",
                    analysis.candidate_tags or "",
                ]
            ).lower()

            score = 0

            query_terms = query_lower.split()

            for term in query_terms:
                if term in searchable_text:
                    score += 1

            score += float(analysis.fit_score or 0) / 100

            if score > 0:
                scored_results.append(
                    {
                        "semantic_score": round(score, 2),
                        "candidate": serialize_candidate(analysis),
                    }
                )

        scored_results.sort(
            key=lambda item: item["semantic_score"],
            reverse=True,
        )

        return {
            "query": query,
            "count": len(scored_results),
            "results": scored_results[:25],
        }

    finally:
        db.close()

    @router.get("/compare")
def compare_candidates(
    candidate_ids: str,
):
    db: Session = SessionLocal()

    try:
        parsed_ids = []

        for raw_id in candidate_ids.split(","):
            raw_id = raw_id.strip()

            if raw_id.isdigit():
                parsed_ids.append(int(raw_id))

        if len(parsed_ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 candidate IDs required.",
            )

        analyses = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id.in_(parsed_ids))
            .all()
        )

        comparison_results = []

        top_candidate = None
        top_score = -1

        for analysis in analyses:
            candidate_payload = {
                "id": analysis.id,
                "candidate_name": analysis.candidate_name,
                "resume_filename": analysis.resume_filename,
                "fit_score": analysis.fit_score,
                "status": analysis.candidate_status or "screening",
                "bookmarked": bool(analysis.bookmarked),
                "matched_skills": analysis.matched_skills,
                "missing_skills": analysis.missing_skills,
                "recommendation": analysis.hiring_recommendation,
                "strengths": analysis.strengths,
                "red_flags": analysis.red_flags,
                "semantic_similarity": analysis.semantic_similarity,
                "ats_score": analysis.ats_score,
                "skill_score": analysis.skill_score,
                "experience_score": analysis.experience_score,
                "project_relevance_score": analysis.project_relevance_score,
                "seniority_match_score": analysis.seniority_match_score,
            }

            comparison_results.append(candidate_payload)

            score = float(analysis.fit_score or 0)

            if score > top_score:
                top_score = score
                top_candidate = analysis

        ai_summary = None

        if top_candidate:
            ai_summary = (
                f"{top_candidate.candidate_name or 'This candidate'} "
                f"currently appears strongest overall with a fit score of "
                f"{top_candidate.fit_score}. "
                f"Their recommendation is: "
                f"{top_candidate.hiring_recommendation or 'No recommendation available'}."
            )

        return {
            "count": len(comparison_results),
            "top_candidate_id": (
                top_candidate.id if top_candidate else None
            ),
            "ai_summary": ai_summary,
            "candidates": comparison_results,
        }

    finally:
        db.close()