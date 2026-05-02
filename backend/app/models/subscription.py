from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON, Uuid

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company


class SubscriptionStatus(str, Enum):
    trialing = "trialing"
    active = "active"
    suspended = "suspended"
    canceled = "canceled"
    expired = "expired"


class BillingStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


jsonb_type = postgresql.JSONB().with_variant(JSON(), "sqlite")


class Plan(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "plans"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    max_users: Mapped[int] = mapped_column(Integer, nullable=False)
    max_products: Mapped[int] = mapped_column(Integer, nullable=False)
    max_sales_per_month: Mapped[int] = mapped_column(Integer, nullable=False)
    features: Mapped[dict[str, Any]] = mapped_column(jsonb_type, default=dict, nullable=False)
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="plan")


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("company_id", name="uq_subscriptions_company"),)

    company_id = mapped_column(Uuid, ForeignKey("companies.id"), nullable=False, index=True)
    plan_id = mapped_column(Uuid, ForeignKey("plans.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=SubscriptionStatus.trialing.value, index=True)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    suspension_reason: Mapped[str | None] = mapped_column(Text)

    company: Mapped["Company"] = relationship(back_populates="subscription")
    plan: Mapped[Plan] = relationship(back_populates="subscriptions")
    billing_history: Mapped[list["BillingHistory"]] = relationship(back_populates="subscription")


class BillingHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "billing_history"

    company_id = mapped_column(Uuid, ForeignKey("companies.id"), nullable=False, index=True)
    subscription_id = mapped_column(Uuid, ForeignKey("subscriptions.id"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="BRL", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=BillingStatus.pending.value, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    invoice_url: Mapped[str | None] = mapped_column(Text)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    company: Mapped["Company"] = relationship(back_populates="billing_history")
    subscription: Mapped[Subscription] = relationship(back_populates="billing_history")
