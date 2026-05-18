import json

from fastapi import APIRouter
from fastapi import Form
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

from app.db.models import RecruiterUser
from app.db.models import TeamAuditLog
from app.db.models import TeamRolePermission


router = APIRouter(
    prefix="/api/v1/team-security",
    tags=["team-security"],
)


def serialize_permission(permission):
    return {
        "id": permission.id,
        "role_name": permission.role_name,
        "can_manage_team": permission.can_manage_team,
        "can_manage_candidates": (
            permission.can_manage_candidates
        ),
        "can_leave_comments": (
            permission.can_leave_comments
        ),
        "can_view_pipeline": (
            permission.can_view_pipeline
        ),
        "can_manage_billing": (
            permission.can_manage_billing
        ),
        "can_invite_recruiters": (
            permission.can_invite_recruiters
        ),
    }


def serialize_audit_log(log):
    return {
        "id": log.id,
        "created_at": log.created_at,
        "team_id": log.team_id,
        "recruiter_user_id": log.recruiter_user_id,
        "action_type": log.action_type,
        "target_type": log.target_type,
        "target_id": log.target_id,
        "action_summary": log.action_summary,
        "metadata_json": log.metadata_json,
    }


@router.post("/permissions/create")
def create_role_permission(
    role_name: str = Form(...),
    can_manage_team: bool = Form(False),
    can_manage_candidates: bool = Form(False),
    can_leave_comments: bool = Form(True),
    can_view_pipeline: bool = Form(True),
    can_manage_billing: bool = Form(False),
    can_invite_recruiters: bool = Form(False),
):
    db: Session = SessionLocal()

    try:
        existing = (
            db.query(TeamRolePermission)
            .filter(
                TeamRolePermission.role_name
                == role_name
            )
            .first()
        )

        if existing:
            return {
                "detail": "Role already exists.",
            }

        permission = TeamRolePermission(
            role_name=role_name,
            can_manage_team=can_manage_team,
            can_manage_candidates=can_manage_candidates,
            can_leave_comments=can_leave_comments,
            can_view_pipeline=can_view_pipeline,
            can_manage_billing=can_manage_billing,
            can_invite_recruiters=can_invite_recruiters,
        )

        db.add(permission)
        db.commit()
        db.refresh(permission)

        return {
            "message": "Role permission created.",
            "permission": serialize_permission(permission),
        }

    finally:
        db.close()


@router.get("/permissions")
def list_role_permissions():
    db: Session = SessionLocal()

    try:
        permissions = (
            db.query(TeamRolePermission)
            .order_by(TeamRolePermission.role_name)
            .all()
        )

        return {
            "count": len(permissions),
            "permissions": [
                serialize_permission(permission)
                for permission in permissions
            ],
        }

    finally:
        db.close()


@router.post("/audit-log")
def create_audit_log(
    team_id: int = Form(...),
    recruiter_user_id: int = Form(...),
    action_type: str = Form(...),
    target_type: str = Form("candidate"),
    target_id: int = Form(None),
    action_summary: str = Form(...),
    metadata_json: str = Form("{}"),
):
    db: Session = SessionLocal()

    try:
        recruiter = (
            db.query(RecruiterUser)
            .filter(RecruiterUser.id == recruiter_user_id)
            .first()
        )

        if not recruiter:
            return {
                "detail": "Recruiter user not found.",
            }

        log = TeamAuditLog(
            team_id=team_id,
            recruiter_user_id=recruiter_user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            action_summary=action_summary,
            metadata_json=metadata_json,
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "message": "Audit log created.",
            "audit_log": serialize_audit_log(log),
        }

    finally:
        db.close()


@router.get("/audit-log/team/{team_id}")
def list_team_audit_logs(team_id: int):
    db: Session = SessionLocal()

    try:
        logs = (
            db.query(TeamAuditLog)
            .filter(TeamAuditLog.team_id == team_id)
            .order_by(desc(TeamAuditLog.created_at))
            .limit(250)
            .all()
        )

        return {
            "team_id": team_id,
            "count": len(logs),
            "logs": [
                serialize_audit_log(log)
                for log in logs
            ],
        }

    finally:
        db.close()