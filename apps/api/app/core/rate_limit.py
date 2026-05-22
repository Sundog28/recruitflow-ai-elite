from collections import defaultdict
from datetime import datetime
from datetime import timedelta
import os

from fastapi import HTTPException

from slowapi import Limiter
from slowapi.util import get_remote_address

try:
    import redis
except Exception:
    redis = None


limiter = Limiter(
    key_func=get_remote_address,
)


RATE_LIMIT_STORE = defaultdict(list)

REDIS_URL = os.getenv("REDIS_URL")

redis_client = None

if redis and REDIS_URL:
    try:
        redis_client = redis.from_url(
            REDIS_URL,
            decode_responses=True,
        )
    except Exception:
        redis_client = None


def enforce_memory_rate_limit(
    key: str,
    limit: int,
    window_seconds: int,
):
    now = datetime.utcnow()
    window_start = now - timedelta(
        seconds=window_seconds
    )

    recent_requests = [
        timestamp
        for timestamp in RATE_LIMIT_STORE[key]
        if timestamp > window_start
    ]

    RATE_LIMIT_STORE[key] = recent_requests

    if len(recent_requests) >= limit:
        raise HTTPException(
            status_code=429,
            detail=(
                "Rate limit exceeded. Please slow down "
                "and try again."
            ),
        )

    RATE_LIMIT_STORE[key].append(now)


def enforce_redis_rate_limit(
    key: str,
    limit: int,
    window_seconds: int,
):
    if not redis_client:
        raise RuntimeError(
            "Redis rate limit client is not configured."
        )

    redis_key = f"rate_limit:{key}"

    current_count = redis_client.incr(redis_key)

    if current_count == 1:
        redis_client.expire(
            redis_key,
            window_seconds,
        )

    if current_count > limit:
        raise HTTPException(
            status_code=429,
            detail=(
                "Rate limit exceeded. Please slow down "
                "and try again."
            ),
        )


def enforce_rate_limit(
    key: str,
    limit: int = 60,
    window_seconds: int = 60,
):
    if redis_client:
        try:
            enforce_redis_rate_limit(
                key=key,
                limit=limit,
                window_seconds=window_seconds,
            )
            return
        except HTTPException:
            raise
        except Exception:
            pass

    enforce_memory_rate_limit(
        key=key,
        limit=limit,
        window_seconds=window_seconds,
    )


def recruiter_rate_limit_key(
    recruiter_id: int,
    feature_name: str,
):
    return f"recruiter:{recruiter_id}:{feature_name}"