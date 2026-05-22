import os

APP_ENV = os.getenv("APP_ENV", "development")
SENTRY_DSN = os.getenv("SENTRY_DSN")


def configure_sentry():
    if not SENTRY_DSN:
        print("SENTRY DISABLED: SENTRY_DSN not configured.")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=APP_ENV,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            send_default_pii=False,
        )

        print(f"SENTRY ENABLED: environment={APP_ENV}")

    except Exception as exc:
        print(f"SENTRY DISABLED: failed to initialize: {exc}")