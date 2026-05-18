import os

from redis import Redis
from rq import Queue


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

redis_connection = Redis.from_url(
    REDIS_URL,
    decode_responses=False,
)

ai_queue = Queue(
    "recruitflow-ai",
    connection=redis_connection,
    default_timeout=600,
)