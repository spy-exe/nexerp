from __future__ import annotations

from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import ActivatableMixin, CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.product import Product
    from app.models.user import User


class StockMovementType(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    ADJUSTMENT = "adjustment"


class Warehouse(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin, ActivatableMixin):
    __tablename__ = "warehouses"
    __table_args__ = (UniqueConstraint("company_id", "name", name="uq_warehouses_company_name"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    company: Mapped["Company"] = relationship(back_populates="warehouses")
    balances: Mapped[list["StockBalance"]] = relationship(back_populates="warehouse")
    movements: Mapped[list["StockMovement"]] = relationship(back_populates="warehouse")


class StockBalance(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "stock_balances"
    __table_args__ = (
        UniqueConstraint("company_id", "product_id", "warehouse_id", name="uq_stock_balances_scope"),
    )

    product_id = mapped_column(Uuid, ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id = mapped_column(Uuid, ForeignKey("warehouses.id"), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="stock_balances")
    warehouse: Mapped["Warehouse"] = relationship(back_populates="balances")


class StockMovement(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "stock_movements"

    product_id = mapped_column(Uuid, ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id = mapped_column(Uuid, ForeignKey("warehouses.id"), nullable=False, index=True)
    user_id = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    reference_id: Mapped[str | None] = mapped_column(String(64))
    reference_type: Mapped[str | None] = mapped_column(String(64))
    notes: Mapped[str | None] = mapped_column(String(500))

    product: Mapped["Product"] = relationship(back_populates="stock_movements")
    warehouse: Mapped["Warehouse"] = relationship(back_populates="movements")
    user: Mapped["User"] = relationship()
