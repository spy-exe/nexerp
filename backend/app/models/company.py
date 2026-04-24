from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, relationship, mapped_column

from app.core.database import Base
from app.models.base import ActivatableMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.product import Product
    from app.models.role import Role
    from app.models.stock import Warehouse
    from app.models.user import User


class Company(Base, UUIDPrimaryKeyMixin, TimestampMixin, ActivatableMixin):
    __tablename__ = "companies"

    trade_name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    cnpj: Mapped[str] = mapped_column(String(14), nullable=False, unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    address_zip: Mapped[str | None] = mapped_column(String(8))
    address_state: Mapped[str | None] = mapped_column(String(2))
    address_city: Mapped[str | None] = mapped_column(String(120))
    address_street: Mapped[str | None] = mapped_column(String(255))
    address_number: Mapped[str | None] = mapped_column(String(30))
    address_neighborhood: Mapped[str | None] = mapped_column(String(120))
    logo_url: Mapped[str | None] = mapped_column(String(255))
    plan: Mapped[str] = mapped_column(String(50), default="community", nullable=False)
    tax_regime: Mapped[str | None] = mapped_column(String(50))
    cnae: Mapped[str | None] = mapped_column(String(20))
    timezone: Mapped[str] = mapped_column(String(80), default="America/Sao_Paulo", nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="BRL", nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="company")
    roles: Mapped[list["Role"]] = relationship(back_populates="company")
    categories: Mapped[list["Category"]] = relationship(back_populates="company")
    products: Mapped[list["Product"]] = relationship(back_populates="company")
    warehouses: Mapped[list["Warehouse"]] = relationship(back_populates="company")
