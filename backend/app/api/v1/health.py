from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request

from app.schemas.common import APIHealthStatus

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=APIHealthStatus, summary="Health check da aplicação")
async def health_check(request: Request) -> APIHealthStatus:
    database_status = "ok"
    redis_status = "ok"

    try:
        await request.app.state.db_manager.ping()
    except Exception:
        database_status = "error"

    try:
        await request.app.state.token_store.ping()
    except Exception:
        redis_status = "error"

    return APIHealthStatus(
        status="ok" if database_status == "ok" else "degraded",
        database=database_status,
        redis=redis_status,
        timestamp=datetime.now(tz=UTC),
    )
