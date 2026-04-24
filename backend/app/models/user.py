from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import ActivatableMixin, CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.role import user_roles

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.refresh_token import RefreshToken
    from app.models.role import Role


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin, ActivatableMixin):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    last_login: Mapped[datetime | None]

    last_login: Mapped[datetime | None] = mapped_column()

    company: Mapped["Company"] = relationship(back_populates="users")
    roles: Mapped[list["Role"]] = relationship(
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")
