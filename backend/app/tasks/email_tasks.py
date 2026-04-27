from __future__ import annotations

import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.email_tasks.send_password_reset_email")
def send_password_reset_email(email: str, reset_link: str) -> None:
    logger.info("Password reset requested for %s via %s", email, reset_link)
