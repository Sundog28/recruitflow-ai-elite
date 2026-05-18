from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord

from app.services.vector_embedding_service import (
    cosine_similarity,
    generate_candidate_embedding,
    generate_embedding,
)


router = APIRouter(
    prefix="/api/v1/vector-search",
    tags=["vector-search"],
)


def serialize_vector_candidate(
    candidate: AnalysisRecord,
    score: float | None = None,
):
    return {
        "id": candidate.id,
        "candidate_name": candidate.candidate_name,
        "resume_filename": candidate.resume_filename,
        "fit_score": candidate.fit_score,
        "status": candidate.candidate_status or "screening",
        "bookmarked": bool(candidate.bookmarked),
        "matched_skills": candidate.matched_skills,
        "missing_skills": candidate.missing_skills,
        "recommendation": candidate.hiring_recommendation,
        "semantic_similarity": candidate.semantic_similarity,
        "vector_score": score,
        "embedding_model": candidate.embedding_model,
    }


def normalize_vector(value):
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, tuple):
        return list(value)

    if hasattr(value, "tolist"):
        return value.tolist()

    if isinstance(value, str):
        cleaned = value.strip().replace("[", "").replace("]", "")

        if not cleaned:
            return []

        return [
            float(part.strip())
            for part in cleaned.split(",")
            if part.strip()
        ]

    try:
        return list(value)
    except Exception:
        return []


@router.post("/candidate/{candidate_id}/embed")
def embed_candidate(candidate_id: int):
    db: Session = SessionLocal()

    try:
        candidate = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not candidate:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found.",
            )

        embedding_payload = generate_candidate_embedding(candidate)

        candidate.embedding_text = embedding_payload["embedding_text"]
        candidate.embedding_model = embedding_payload["embedding_model"]
        candidate.candidate_embedding = embedding_payload[
            "candidate_embedding"
        ]

        db.commit()
        db.refresh(candidate)

        return {
            "message": "Candidate embedding generated.",
            "candidate_id": candidate.id,
            "embedding_model": candidate.embedding_model,
            "embedding_dimensions": len(
                normalize_vector(candidate.candidate_embedding)
            ),
        }

    finally:
        db.close()


@router.post("/backfill")
def backfill_candidate_embeddings():
    db: Session = SessionLocal()

    try:
        candidates = (
            db.query(AnalysisRecord)
            .order_by(desc(AnalysisRecord.created_at))
            .limit(250)
            .all()
        )

        updated = 0

        for candidate in candidates:
            embedding_payload = generate_candidate_embedding(candidate)

            candidate.embedding_text = embedding_payload["embedding_text"]
            candidate.embedding_model = embedding_payload["embedding_model"]
            candidate.candidate_embedding = embedding_payload[
                "candidate_embedding"
            ]

            updated += 1

        db.commit()

        return {
            "message": "Candidate embeddings backfilled.",
            "updated": updated,
        }

    finally:
        db.close()


@router.get("/candidates")
def vector_search_candidates(
    query: str,
    limit: int = 10,
):
    db: Session = SessionLocal()

    try:
        if not query.strip():
            raise HTTPException(
                status_code=400,
                detail="Search query is required.",
            )

        query_embedding = generate_embedding(query)

        candidates = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.candidate_embedding.isnot(None))
            .order_by(desc(AnalysisRecord.created_at))
            .limit(250)
            .all()
        )

        scored_candidates = []

        for candidate in candidates:
            candidate_vector = normalize_vector(
                candidate.candidate_embedding
            )

            if not candidate_vector:
                continue

            score = cosine_similarity(
                query_embedding,
                candidate_vector,
            )

            rounded_score = round(score, 4)

            scored_candidates.append(
                {
                    "score": rounded_score,
                    "candidate": serialize_vector_candidate(
                        candidate,
                        rounded_score,
                    ),
                }
            )

        scored_candidates.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return {
            "query": query,
            "count": len(scored_candidates),
            "results": scored_candidates[:limit],
        }

    finally:
        db.close()