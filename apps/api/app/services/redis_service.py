import json
import os

import redis


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

redis_client = redis.Redis.from_url(
    REDIS_URL,
    decode_responses=True,
)


def get_cache(key: str):
    try:
        value = redis_client.get(key)

        if value is None:
            return None

        return json.loads(value)

    except Exception:
        return None


def set_cache(
    key: str,
    value,
    expiration_seconds: int = 3600,
):
    try:
        redis_client.set(
            key,
            json.dumps(value),
            ex=expiration_seconds,
        )

    except Exception:
        pass


def delete_cache(key: str):
    try:
        redis_client.delete(key)

    except Exception:
        pass