import os

import sentry_sdk


SENTRY_DSN = os.getenv("SENTRY_DSN")
APP_ENV = os.getenv("APP_ENV", "development")


def configure_sentry():
    if not SENTRY_DSN:
        return

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=APP_ENV,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        send_default_pii=False,
    )