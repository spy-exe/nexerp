from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.config import Settings
from app.core.database import DatabaseManager
from app.core.rate_limit import BaseRateLimiter
from app.core.security import decode_token
from app.core.token_store import BaseTokenStore
from app.models.user import User
from app.services.auth_service import AuthService


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class RequestUser:
    id: UUID
    company_id: UUID
    name: str
    email: str
    permissions: set[str]
    role_names: list[str]
    user: User


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db_manager(request: Request) -> DatabaseManager:
    return request.app.state.db_manager


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    manager = get_db_manager(request)
    async for session in manager.session():
        yield session


def get_token_store(request: Request) -> BaseTokenStore:
    return request.app.state.token_store


def get_rate_limiter(request: Request) -> BaseRateLimiter:
    return request.app.state.rate_limiter


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is None:
        return "unknown"
    return request.client.host


async def enforce_rate_limit(
    request: Request,
    *,
    bucket: str,
    limit: int,
    window_seconds: int,
) -> None:
    limiter = get_rate_limiter(request)
    ip_address = get_client_ip(request)
    result = await limiter.acquire(f"{bucket}:{ip_address}", limit, window_seconds)
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Limite de requisições excedido.",
            headers={"Retry-After": str(result.retry_after)},
        )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RequestUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação obrigatória.")

    payload = decode_token(credentials.credentials, settings, "access")
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles), joinedload(User.company))
        .where(User.id == UUID(str(payload["sub"])), User.deleted_at.is_(None), User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado.")

    await get_db_manager(request).set_tenant_context(db, user.company_id)
    permissions = AuthService.collect_permissions(user)
    return RequestUser(
        id=user.id,
        company_id=user.company_id,
        name=user.name,
        email=user.email,
        permissions=permissions,
        role_names=[role.name for role in user.roles],
        user=user,
    )


def require_permission(permission: str):
    async def dependency(current_user: RequestUser = Depends(get_current_user)) -> RequestUser:
        if "*" in current_user.permissions or permission in current_user.permissions:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para executar esta ação.",
        )

    return dependency
