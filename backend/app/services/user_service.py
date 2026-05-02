from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.services.audit_service import AuditService
from app.services.subscription_service import SubscriptionService


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def create(
        self,
        *,
        company_id: UUID,
        name: str,
        email: str,
        password: str,
        role_ids: Sequence[UUID] | None = None,
        actor_user_id: UUID | None = None,
        ip_address: str | None = None,
    ) -> User:
        current_count = await self._count_active_users(company_id)
        await SubscriptionService(self.db).check_limit(company_id, "users", current_count)
        await self._ensure_email_available(email)

        try:
            password_hash = hash_password(password)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        user = User(company_id=company_id, name=name, email=email, password_hash=password_hash)
        if role_ids:
            user.roles = await self._load_roles(company_id, role_ids)

        self.db.add(user)
        await self.db.flush()
        self.audit.log(
            company_id=company_id,
            user_id=actor_user_id,
            action="users.created",
            table_name="users",
            record_id=str(user.id),
            new_data={"name": name, "email": email, "role_ids": [str(role_id) for role_id in role_ids or []]},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def _count_active_users(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(User.id)).where(
                User.company_id == company_id,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        return int(result.scalar_one())

    async def _ensure_email_available(self, email: str) -> None:
        result = await self.db.execute(select(User.id).where(User.email == email))
        if result.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Usuário já cadastrado.")

    async def _load_roles(self, company_id: UUID, role_ids: Sequence[UUID]) -> list[Role]:
        unique_role_ids = set(role_ids)
        result = await self.db.execute(
            select(Role).where(Role.company_id == company_id, Role.id.in_(unique_role_ids))
        )
        roles = list(result.scalars().all())
        if len(roles) != len(unique_role_ids):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Papel inválido.")
        return roles
