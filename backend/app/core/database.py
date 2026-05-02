from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

from app.core.config import Settings


class Base(DeclarativeBase):
    """Declarative SQLAlchemy base."""


class DatabaseManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        is_sqlite = "sqlite" in settings.async_database_url
        engine_kwargs: dict[str, Any] = {"future": True}
        if is_sqlite:
            engine_kwargs["connect_args"] = {"check_same_thread": False}
            engine_kwargs["poolclass"] = StaticPool
        else:
            engine_kwargs["pool_pre_ping"] = True
        self.engine: AsyncEngine = create_async_engine(
            settings.async_database_url,
            **engine_kwargs,
        )
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            yield session

    async def ping(self) -> None:
        async with self.engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

    async def set_tenant_context(self, session: AsyncSession, company_id: UUID | str) -> None:
        if session.bind is None or session.bind.dialect.name != "postgresql":
            return
        await session.execute(
            text("SELECT set_config('app.current_is_superadmin', 'false', true)")
        )
        await session.execute(
            text("SELECT set_config('app.current_company_id', :company_id, true)"),
            {"company_id": str(company_id)},
        )

    async def set_superadmin_context(self, session: AsyncSession) -> None:
        if session.bind is None or session.bind.dialect.name != "postgresql":
            return
        await session.execute(text("SELECT set_config('app.current_is_superadmin', 'true', true)"))
        await session.execute(text("SELECT set_config('app.current_company_id', '', true)"))

    async def dispose(self) -> None:
        await self.engine.dispose()


def serialize_decimal(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)
