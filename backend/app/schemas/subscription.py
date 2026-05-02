from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.company import CompanyResponse


class PlanBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=50, pattern="^[a-z0-9-]+$")
    description: str | None = None
    max_users: int = Field(ge=1)
    max_products: int = Field(ge=1)
    max_sales_per_month: int = Field(ge=1)
    features: dict[str, Any] = Field(default_factory=dict)
    price_monthly: Decimal = Field(ge=0)
    is_active: bool = True


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=50, pattern="^[a-z0-9-]+$")
    description: str | None = None
    max_users: int | None = Field(default=None, ge=1)
    max_products: int | None = Field(default=None, ge=1)
    max_sales_per_month: int | None = Field(default=None, ge=1)
    features: dict[str, Any] | None = None
    price_monthly: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class PlanResponse(PlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class SubscriptionAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    plan_id: UUID
    status: str
    trial_ends_at: datetime | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    canceled_at: datetime | None = None
    suspension_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    plan: PlanResponse


class UsageMetric(BaseModel):
    current: int
    limit: int
    percentage: float


class UsageDetails(BaseModel):
    users: UsageMetric
    products: UsageMetric
    sales_per_month: UsageMetric


class SubscriptionUsagePlan(BaseModel):
    id: UUID
    name: str
    slug: str
    price_monthly: Decimal
    limits: dict[str, int]


class SubscriptionUsageResponse(BaseModel):
    plan: SubscriptionUsagePlan
    status: str
    trial_ends_at: datetime | None = None
    usage: UsageDetails


class BillingHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    subscription_id: UUID
    amount: Decimal
    currency: str
    status: str
    description: str | None = None
    invoice_url: str | None = None
    paid_at: datetime | None = None
    created_at: datetime


class AdminCompanyListItem(BaseModel):
    company: CompanyResponse
    is_active: bool
    created_at: datetime
    subscription: SubscriptionAdminResponse | None = None


class AdminCompanyDetail(BaseModel):
    company: CompanyResponse
    is_active: bool
    created_at: datetime
    updated_at: datetime
    subscription: SubscriptionAdminResponse | None = None
    usage: UsageDetails | None = None
    billing_history: list[BillingHistoryResponse]


class SuspendCompanyRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)


class ChangeCompanyPlanRequest(BaseModel):
    plan_id: UUID | None = None
    plan_slug: str | None = Field(default=None, min_length=2, max_length=50)


class AdminStatsResponse(BaseModel):
    total_companies: int
    active_today: int
    trialing: int


class FeedbackResponse(BaseModel):
    id: UUID | None = None
    company_id: UUID | None = None
    user_id: UUID | None = None
    message: str | None = None
    rating: int | None = None
    created_at: datetime | None = None
