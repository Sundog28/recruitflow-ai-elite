from fastapi import APIRouter
from fastapi import Depends

from app.core.auth_dependencies import get_current_recruiter
from app.db.models import RecruiterUser
from app.services.audit_log_service import list_audit_logs


router = APIRouter(
    prefix="/api/v1/audit-logs",
    tags=["audit-logs"],
)


@router.get("/")
def get_recruiter_audit_logs(
    recruiter: RecruiterUser = Depends(get_current_recruiter),
):
    logs = list_audit_logs(
        recruiter_id=recruiter.id,
        limit=100,
    )

    return {
        "count": len(logs),
        "logs": logs,
    }