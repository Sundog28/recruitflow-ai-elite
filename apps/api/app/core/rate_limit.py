from collections import defaultdict
from datetime import datetime
from datetime import timedelta
from fastapi import HTTPException


RATE_LIMIT_STORE = defaultdict(list)


def enforce_rate_limit(
    key: str,
    limit: int = 60,
    window_seconds: int = 60,
):
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)

    recent_requests = [
        timestamp
        for timestamp in RATE_LIMIT_STORE[key]
        if timestamp > window_start
    ]

    RATE_LIMIT_STORE[key] = recent_requests

    if len(recent_requests) >= limit:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please slow down and try again.",
        )

    RATE_LIMIT_STORE[key].append(now)


def recruiter_rate_limit_key(
    recruiter_id: int,
    feature_name: str,
):
    return f"recruiter:{recruiter_id}:{feature_name}"