from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.product import Product
from app.models.sale import Sale
from app.models.subscription import Plan, Subscription, SubscriptionStatus
from app.models.user import User


BETA_PLAN_DEFAULTS: dict[str, Any] = {
    "name": "Beta",
    "slug": "beta",
    "description": "Plano beta gratuito para empresas em onboarding.",
    "max_users": 50,
    "max_products": 9999,
    "max_sales_per_month": 9999,
    "features": {"support": "community", "beta": True},
    "price_monthly": Decimal("0.00"),
    "is_active": True,
}
LIMIT_FIELDS = {
    "users": "max_users",
    "max_users": "max_users",
    "products": "max_products",
    "max_products": "max_products",
    "sales_per_month": "max_sales_per_month",
    "max_sales_per_month": "max_sales_per_month",
}
LIMIT_LABELS = {
    "max_users": "usuários",
    "max_products": "produtos",
    "max_sales_per_month": "vendas mensais",
}


class LimitExceededException(HTTPException):
    def __init__(self, resource: str, limit: int) -> None:
        label = LIMIT_LABELS.get(resource, resource)
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Limite do plano excedido para {label}. Limite atual: {limit}.",
        )


class SubscriptionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_active_subscription(self, company_id: UUID) -> Subscription:
        subscription = await self._get_subscription(company_id)
        if subscription is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assinatura não encontrada.")

        await self._expire_trial_if_needed(subscription)
        if subscription.status in {SubscriptionStatus.active.value, SubscriptionStatus.trialing.value}:
            return subscription
        if subscription.status == SubscriptionStatus.suspended.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta suspensa. Entre em contato com o suporte.",
            )
        if subscription.status == SubscriptionStatus.expired.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Período de trial expirado.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assinatura inativa.")

    async def check_limit(self, company_id: UUID, resource: str, current_count: int) -> None:
        limit_field = LIMIT_FIELDS.get(resource)
        if limit_field is None:
            raise ValueError(f"Recurso de assinatura desconhecido: {resource}")

        subscription = await self.get_active_subscription(company_id)
        limit = int(getattr(subscription.plan, limit_field))
        if current_count >= limit:
            raise LimitExceededException(limit_field, limit)

    async def suspend_company(self, company_id: UUID, reason: str) -> Subscription:
        subscription = await self._get_required_subscription(company_id)
        subscription.status = SubscriptionStatus.suspended.value
        subscription.suspension_reason = reason
        await self.db.commit()
        return await self._get_required_subscription(company_id)

    async def reactivate_company(self, company_id: UUID) -> Subscription:
        subscription = await self._get_required_subscription(company_id)
        subscription.status = self._reactivated_status(subscription)
        subscription.suspension_reason = None
        subscription.canceled_at = None
        await self.db.commit()
        return await self._get_required_subscription(company_id)

    async def cancel_subscription(self, company_id: UUID) -> Subscription:
        subscription = await self._get_required_subscription(company_id)
        now = datetime.now(tz=UTC)
        subscription.status = SubscriptionStatus.canceled.value
        subscription.canceled_at = now
        subscription.current_period_end = now
        await self.db.commit()
        return await self._get_required_subscription(company_id)

    async def change_plan(self, company_id: UUID, plan_id: UUID) -> Subscription:
        subscription = await self._get_required_subscription(company_id)
        plan = await self._get_active_plan(plan_id)
        subscription.plan_id = plan.id
        subscription.plan = plan
        subscription.status = self._reactivated_status(subscription)
        subscription.suspension_reason = None
        await self.db.commit()
        return await self._get_required_subscription(company_id)

    async def create_beta_subscription(self, company_id: UUID) -> Subscription:
        plan = await self._get_or_create_beta_plan()
        now = datetime.now(tz=UTC)
        trial_end = now + timedelta(days=365)
        subscription = Subscription(
            company_id=company_id,
            plan_id=plan.id,
            status=SubscriptionStatus.trialing.value,
            trial_ends_at=trial_end,
            current_period_start=now,
            current_period_end=trial_end,
        )
        self.db.add(subscription)
        await self.db.flush()
        return subscription

    async def get_usage(self, company_id: UUID) -> dict[str, Any]:
        subscription = await self.get_active_subscription(company_id)
        users_count = await self._count_users(company_id)
        products_count = await self._count_products(company_id)
        sales_count = await self._count_sales_this_month(company_id)
        plan = subscription.plan

        return {
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "slug": plan.slug,
                "price_monthly": plan.price_monthly,
                "limits": {
                    "max_users": plan.max_users,
                    "max_products": plan.max_products,
                    "max_sales_per_month": plan.max_sales_per_month,
                },
            },
            "status": subscription.status,
            "trial_ends_at": subscription.trial_ends_at,
            "usage": {
                "users": self._usage_row(users_count, plan.max_users),
                "products": self._usage_row(products_count, plan.max_products),
                "sales_per_month": self._usage_row(sales_count, plan.max_sales_per_month),
            },
        }

    async def _get_subscription(self, company_id: UUID) -> Subscription | None:
        result = await self.db.execute(
            select(Subscription)
            .options(joinedload(Subscription.plan))
            .where(Subscription.company_id == company_id)
        )
        return result.scalar_one_or_none()

    async def _get_required_subscription(self, company_id: UUID) -> Subscription:
        subscription = await self._get_subscription(company_id)
        if subscription is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assinatura não encontrada.")
        return subscription

    async def _get_active_plan(self, plan_id: UUID) -> Plan:
        result = await self.db.execute(select(Plan).where(Plan.id == plan_id, Plan.is_active.is_(True)))
        plan = result.scalar_one_or_none()
        if plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado.")
        return plan

    async def _get_or_create_beta_plan(self) -> Plan:
        result = await self.db.execute(select(Plan).where(Plan.slug == "beta"))
        plan = result.scalar_one_or_none()
        if plan is not None:
            return plan

        plan = Plan(**BETA_PLAN_DEFAULTS)
        self.db.add(plan)
        await self.db.flush()
        return plan

    async def _expire_trial_if_needed(self, subscription: Subscription) -> None:
        if subscription.status != SubscriptionStatus.trialing.value or subscription.trial_ends_at is None:
            return
        if self._as_aware(subscription.trial_ends_at) > datetime.now(tz=UTC):
            return

        subscription.status = SubscriptionStatus.expired.value
        await self.db.commit()

    async def _count_users(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(User.id)).where(
                User.company_id == company_id,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        return int(result.scalar_one())

    async def _count_products(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Product.id)).where(
                Product.company_id == company_id,
                Product.deleted_at.is_(None),
            )
        )
        return int(result.scalar_one())

    async def _count_sales_this_month(self, company_id: UUID) -> int:
        now = datetime.now(tz=UTC)
        month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
        if now.month == 12:
            next_month = datetime(now.year + 1, 1, 1, tzinfo=UTC)
        else:
            next_month = datetime(now.year, now.month + 1, 1, tzinfo=UTC)

        result = await self.db.execute(
            select(func.count(Sale.id)).where(
                Sale.company_id == company_id,
                Sale.issued_at >= month_start,
                Sale.issued_at < next_month,
            )
        )
        return int(result.scalar_one())

    @staticmethod
    def _reactivated_status(subscription: Subscription) -> str:
        if subscription.trial_ends_at is not None and SubscriptionService._as_aware(subscription.trial_ends_at) > datetime.now(tz=UTC):
            return SubscriptionStatus.trialing.value
        return SubscriptionStatus.active.value

    @staticmethod
    def _usage_row(current: int, limit: int) -> dict[str, int | float]:
        percentage = 0.0 if limit <= 0 else round((current / limit) * 100, 2)
        return {"current": current, "limit": limit, "percentage": percentage}

    @staticmethod
    def _as_aware(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value
