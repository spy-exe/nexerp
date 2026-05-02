from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import ActivatableMixin, CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.role import user_roles

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.fiscal import FiscalDocument
    from app.models.purchase import Purchase
    from app.models.refresh_token import RefreshToken
    from app.models.role import Role
    from app.models.sale import Sale


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin, ActivatableMixin):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    company_id = mapped_column(Uuid, ForeignKey("companies.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    last_login: Mapped[datetime | None] = mapped_column()

    company: Mapped["Company | None"] = relationship(back_populates="users")
    roles: Mapped[list["Role"]] = relationship(
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")
    sales: Mapped[list["Sale"]] = relationship(back_populates="user")
    purchases: Mapped[list["Purchase"]] = relationship(back_populates="user")
    fiscal_documents: Mapped[list["FiscalDocument"]] = relationship(back_populates="user")
