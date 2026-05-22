from datetime import datetime
from typing import Any


AUDIT_LOGS = []


def create_audit_log(
    recruiter_id: int | None,
    event_type: str,
    action: str,
    resource_type: str | None = None,
    resource_id: str | int | None = None,
    metadata: dict[str, Any] | None = None,
):
    log = {
        "id": len(AUDIT_LOGS) + 1,
        "created_at": datetime.utcnow().isoformat(),
        "recruiter_id": recruiter_id,
        "event_type": event_type,
        "action": action,
        "resource_type": resource_type,
        "resource_id": str(resource_id) if resource_id is not None else None,
        "metadata": metadata or {},
    }

    AUDIT_LOGS.append(log)

    return log


def list_audit_logs(
    recruiter_id: int | None = None,
    limit: int = 100,
):
    logs = AUDIT_LOGS

    if recruiter_id is not None:
        logs = [
            log
            for log in logs
            if log.get("recruiter_id") == recruiter_id
        ]

    return sorted(
        logs,
        key=lambda item: item["created_at"],
        reverse=True,
    )[:limit]