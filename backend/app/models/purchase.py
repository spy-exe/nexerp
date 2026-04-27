from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.party import BusinessParty
    from app.models.stock import Warehouse
    from app.models.user import User


class Purchase(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "purchases"
    __table_args__ = (UniqueConstraint("company_id", "purchase_number", name="uq_purchases_company_number"),)

    purchase_number: Mapped[str] = mapped_column(String(30), nullable=False)
    supplier_id = mapped_column(Uuid, ForeignKey("business_parties.id"), nullable=False, index=True)
    user_id = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    warehouse_id = mapped_column(Uuid, ForeignKey("warehouses.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="received")
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500))

    company: Mapped["Company"] = relationship(back_populates="purchases")
    supplier: Mapped["BusinessParty"] = relationship(back_populates="purchases", foreign_keys=[supplier_id])
    user: Mapped["User"] = relationship(back_populates="purchases")
    warehouse: Mapped["Warehouse"] = relationship(back_populates="purchases")
    items: Mapped[list["PurchaseItem"]] = relationship(back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "purchase_items"

    purchase_id = mapped_column(Uuid, ForeignKey("purchases.id"), nullable=False, index=True)
    product_id = mapped_column(Uuid, ForeignKey("products.id"), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[str] = mapped_column(String(80), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    purchase: Mapped["Purchase"] = relationship(back_populates="items")
