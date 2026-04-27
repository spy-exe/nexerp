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
    from app.models.fiscal import FiscalDocument
    from app.models.party import BusinessParty
    from app.models.stock import Warehouse
    from app.models.user import User


class Sale(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "sales"
    __table_args__ = (UniqueConstraint("company_id", "sale_number", name="uq_sales_company_number"),)

    sale_number: Mapped[str] = mapped_column(String(30), nullable=False)
    customer_id = mapped_column(Uuid, ForeignKey("business_parties.id"), nullable=True, index=True)
    user_id = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    warehouse_id = mapped_column(Uuid, ForeignKey("warehouses.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed")
    channel: Mapped[str] = mapped_column(String(20), nullable=False, default="sales")
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    change_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(String(500))

    company: Mapped["Company"] = relationship(back_populates="sales")
    customer: Mapped["BusinessParty | None"] = relationship(back_populates="sales", foreign_keys=[customer_id])
    user: Mapped["User"] = relationship(back_populates="sales")
    warehouse: Mapped["Warehouse"] = relationship(back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan")
    payments: Mapped[list["SalePayment"]] = relationship(back_populates="sale", cascade="all, delete-orphan")
    fiscal_documents: Mapped[list["FiscalDocument"]] = relationship(back_populates="sale")


class SaleItem(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "sale_items"

    sale_id = mapped_column(Uuid, ForeignKey("sales.id"), nullable=False, index=True)
    product_id = mapped_column(Uuid, ForeignKey("products.id"), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[str] = mapped_column(String(80), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped["Sale"] = relationship(back_populates="items")


class SalePayment(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "sale_payments"

    sale_id = mapped_column(Uuid, ForeignKey("sales.id"), nullable=False, index=True)
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(String(255))

    sale: Mapped["Sale"] = relationship(back_populates="payments")
