import logging
import time
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


logger = logging.getLogger("recruitflow.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid4())
        start_time = time.time()

        try:
            response = await call_next(request)

            duration_ms = round(
                (time.time() - start_time) * 1000,
                2,
            )

            logger.info(
                "request_id=%s method=%s path=%s status=%s duration_ms=%s",
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as error:
            duration_ms = round(
                (time.time() - start_time) * 1000,
                2,
            )

            logger.exception(
                "request_id=%s method=%s path=%s error=%s duration_ms=%s",
                request_id,
                request.method,
                request.url.path,
                str(error),
                duration_ms,
            )

            raise