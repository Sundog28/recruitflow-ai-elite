import os

from redis import Redis
from rq import Worker
from rq import Queue
from rq import Connection


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)


listen = [
    "recruitflow-ai",
]


redis_connection = Redis.from_url(
    REDIS_URL,
)


if __name__ == "__main__":
    with Connection(redis_connection):
        worker = Worker(
            [
                Queue(
                    name,
                    connection=redis_connection,
                )
                for name in listen
            ]
        )

        worker.work()