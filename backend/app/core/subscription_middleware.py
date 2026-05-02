from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import decode_token
from app.models.user import User
from app.services.subscription_service import SubscriptionService


async def check_subscription_access(request: Request) -> JSONResponse | None:
    if request.method == "OPTIONS":
        return None

    settings = request.app.state.settings
    if not request.url.path.startswith(settings.api_v1_prefix):
        return None

    token = _bearer_token(request)
    if token is None:
        return None

    try:
        payload = decode_token(token, settings, "access")
        user_id = UUID(str(payload["sub"]))
    except HTTPException as exc:
        return _error_response(exc)
    except (KeyError, ValueError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Token inválido ou expirado."},
        )

    manager = request.app.state.db_manager
    async for db in manager.session():
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.id == user_id, User.deleted_at.is_(None), User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if user is None:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Usuário não encontrado."},
            )

        if user.company_id is None and any(role.name == "superadmin" for role in user.roles):
            await manager.set_superadmin_context(db)
            return None
        if user.company_id is None:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Usuário sem empresa vinculada."},
            )

        await manager.set_tenant_context(db, user.company_id)
        try:
            await SubscriptionService(db).get_active_subscription(user.company_id)
        except HTTPException as exc:
            return _error_response(exc)
    return None


def _bearer_token(request: Request) -> str | None:
    authorization = request.headers.get("authorization")
    if authorization is None:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def _error_response(exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
