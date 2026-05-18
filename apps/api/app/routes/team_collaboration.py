from fastapi import APIRouter
from fastapi import Form
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import AnalysisRecord
from app.db.models import RecruiterTeam
from app.db.models import RecruiterUser
from app.db.models import TeamCandidateComment


router = APIRouter(
    prefix="/api/v1/team-collaboration",
    tags=["team-collaboration"],
)


def serialize_comment(comment: TeamCandidateComment):
    return {
        "id": comment.id,
        "created_at": comment.created_at,
        "team_id": comment.team_id,
        "candidate_id": comment.candidate_id,
        "recruiter_user_id": comment.recruiter_user_id,
        "comment": comment.comment,
        "visibility": comment.visibility,
    }


@router.post("/candidate/{candidate_id}/comments")
def add_team_candidate_comment(
    candidate_id: int,
    team_id: int = Form(...),
    recruiter_user_id: int = Form(...),
    comment: str = Form(...),
    visibility: str = Form("team"),
):
    db: Session = SessionLocal()

    try:
        team = (
            db.query(RecruiterTeam)
            .filter(RecruiterTeam.id == team_id)
            .first()
        )

        if not team:
            return {
                "detail": "Team not found.",
            }

        candidate = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == candidate_id)
            .first()
        )

        if not candidate:
            return {
                "detail": "Candidate not found.",
            }

        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.id == recruiter_user_id)
            .first()
        )

        if not recruiter:
            return {
                "detail": "Recruiter user not found.",
            }

        new_comment = TeamCandidateComment(
            team_id=team_id,
            candidate_id=candidate_id,
            recruiter_user_id=recruiter_user_id,
            comment=comment,
            visibility=visibility,
        )

        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)

        return {
            "message": "Team candidate comment added.",
            "comment": serialize_comment(new_comment),
        }

    finally:
        db.close()


@router.get("/candidate/{candidate_id}/comments")
def list_team_candidate_comments(
    candidate_id: int,
    team_id: int,
):
    db: Session = SessionLocal()

    try:
        comments = (
            db.query(TeamCandidateComment)
            .filter(
                TeamCandidateComment.candidate_id == candidate_id,
                TeamCandidateComment.team_id == team_id,
            )
            .order_by(desc(TeamCandidateComment.created_at))
            .all()
        )

        return {
            "candidate_id": candidate_id,
            "team_id": team_id,
            "count": len(comments),
            "comments": [
                serialize_comment(comment)
                for comment in comments
            ],
        }

    finally:
        db.close()


@router.get("/team/{team_id}/activity")
def list_team_collaboration_activity(team_id: int):
    db: Session = SessionLocal()

    try:
        comments = (
            db.query(TeamCandidateComment)
            .filter(TeamCandidateComment.team_id == team_id)
            .order_by(desc(TeamCandidateComment.created_at))
            .limit(100)
            .all()
        )

        return {
            "team_id": team_id,
            "count": len(comments),
            "activity": [
                serialize_comment(comment)
                for comment in comments
            ],
        }

    finally:
        db.close()


@router.get("/team/{team_id}/pipeline")
def shared_team_pipeline(team_id: int):
    db: Session = SessionLocal()

    try:
        candidates = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.team_id == team_id)
            .order_by(desc(AnalysisRecord.created_at))
            .limit(100)
            .all()
        )

        pipeline = {
            "screening": [],
            "interview": [],
            "offer": [],
            "hired": [],
            "rejected": [],
        }

        for candidate in candidates:
            status = candidate.candidate_status or "screening"

            if status not in pipeline:
                pipeline[status] = []

            pipeline[status].append(
                {
                    "id": candidate.id,
                    "candidate_name": candidate.candidate_name,
                    "resume_filename": candidate.resume_filename,
                    "fit_score": candidate.fit_score,
                    "status": status,
                    "bookmarked": bool(candidate.bookmarked),
                    "recommendation": candidate.hiring_recommendation,
                }
            )

        return {
            "team_id": team_id,
            "pipeline": pipeline,
        }

    finally:
        db.close()