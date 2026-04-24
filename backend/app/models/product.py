from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import ActivatableMixin, CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.company import Company
    from app.models.stock import StockBalance, StockMovement


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin, ActivatableMixin):
    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("company_id", "sku", name="uq_products_company_sku"),)

    sku: Mapped[str] = mapped_column(String(80), nullable=False)
    barcode: Mapped[str | None] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    category_id = mapped_column(Uuid, ForeignKey("categories.id"))
    unit: Mapped[str] = mapped_column(String(20), default="UN", nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    sale_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    min_stock: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0, nullable=False)

    company: Mapped["Company"] = relationship(back_populates="products")
    category: Mapped["Category | None"] = relationship(back_populates="products")
    stock_balances: Mapped[list["StockBalance"]] = relationship(back_populates="product")
    stock_movements: Mapped[list["StockMovement"]] = relationship(back_populates="product")
