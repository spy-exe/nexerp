from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.dependencies import RequestUser, get_db, require_superadmin
from app.models.company import Company
from app.models.feedback import Feedback
from app.models.product import Product
from app.models.sale import Sale
from app.models.subscription import BillingHistory, Plan, Subscription, SubscriptionStatus
from app.models.user import User
from app.schemas.feedback import FeedbackResponse
from app.schemas.subscription import (
    AdminCompanyDetail,
    AdminCompanyListItem,
    AdminStatsResponse,
    BillingHistoryResponse,
    ChangeCompanyPlanRequest,
    PlanCreate,
    PlanResponse,
    PlanUpdate,
    SubscriptionAdminResponse,
    SuspendCompanyRequest,
    UsageDetails,
)
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/companies", response_model=list[AdminCompanyListItem], summary="Listar empresas")
async def list_companies(
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> list[AdminCompanyListItem]:
    result = await db.execute(
        select(Company)
        .options(joinedload(Company.subscription).joinedload(Subscription.plan))
        .where(Company.deleted_at.is_(None))
        .order_by(Company.created_at.desc())
    )
    return [_company_list_item(company) for company in result.scalars().unique().all()]


@router.get("/companies/{company_id}", response_model=AdminCompanyDetail, summary="Detalhes de empresa")
async def get_company_detail(
    company_id: UUID,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> AdminCompanyDetail:
    company = await _get_company(db, company_id)
    billing = await _billing_history(db, company_id)
    usage = await _usage_details(db, company.subscription) if company.subscription else None
    return AdminCompanyDetail.model_validate(
        {
            "company": company,
            "is_active": company.is_active,
            "created_at": company.created_at,
            "updated_at": company.updated_at,
            "subscription": company.subscription,
            "usage": usage,
            "billing_history": billing,
        }
    )


@router.patch(
    "/companies/{company_id}/suspend",
    response_model=SubscriptionAdminResponse,
    summary="Suspender empresa",
)
async def suspend_company(
    company_id: UUID,
    payload: SuspendCompanyRequest,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionAdminResponse:
    subscription = await SubscriptionService(db).suspend_company(company_id, payload.reason)
    return SubscriptionAdminResponse.model_validate(subscription)


@router.patch(
    "/companies/{company_id}/reactivate",
    response_model=SubscriptionAdminResponse,
    summary="Reativar empresa",
)
async def reactivate_company(
    company_id: UUID,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionAdminResponse:
    subscription = await SubscriptionService(db).reactivate_company(company_id)
    return SubscriptionAdminResponse.model_validate(subscription)


@router.patch(
    "/companies/{company_id}/plan",
    response_model=SubscriptionAdminResponse,
    summary="Alterar plano da empresa",
)
async def change_company_plan(
    company_id: UUID,
    payload: ChangeCompanyPlanRequest,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionAdminResponse:
    plan_id = await _resolve_plan_id(db, payload)
    subscription = await SubscriptionService(db).change_plan(company_id, plan_id)
    return SubscriptionAdminResponse.model_validate(subscription)


@router.get("/stats", response_model=AdminStatsResponse, summary="Métricas gerais SaaS")
async def admin_stats(
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> AdminStatsResponse:
    now = datetime.now(tz=UTC)
    total_companies = await db.scalar(select(func.count(Company.id)).where(Company.deleted_at.is_(None)))
    active_today = await db.scalar(
        select(func.count(Subscription.company_id)).where(
            Subscription.status.in_([SubscriptionStatus.active.value, SubscriptionStatus.trialing.value]),
            or_(Subscription.current_period_end.is_(None), Subscription.current_period_end >= now),
        )
    )
    trialing = await db.scalar(
        select(func.count(Subscription.company_id)).where(Subscription.status == SubscriptionStatus.trialing.value)
    )
    return AdminStatsResponse(
        total_companies=int(total_companies or 0),
        active_today=int(active_today or 0),
        trialing=int(trialing or 0),
    )


@router.get("/feedbacks", response_model=list[FeedbackResponse], summary="Listar feedbacks")
async def list_feedbacks(
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> list[FeedbackResponse]:
    result = await db.execute(
        select(Feedback, Company.trade_name, User.email)
        .join(Company, Company.id == Feedback.company_id)
        .outerjoin(User, User.id == Feedback.user_id)
        .order_by(Feedback.created_at.desc())
    )
    return [
        FeedbackResponse.model_validate(
            {
                "id": feedback.id,
                "company_id": feedback.company_id,
                "user_id": feedback.user_id,
                "company_name": company_name,
                "user_email": user_email,
                "message": feedback.message,
                "rating": feedback.rating,
                "created_at": feedback.created_at,
            }
        )
        for feedback, company_name, user_email in result.all()
    ]


@router.get("/plans", response_model=list[PlanResponse], summary="Listar planos")
async def list_plans(
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> list[PlanResponse]:
    result = await db.execute(select(Plan).order_by(Plan.price_monthly.asc(), Plan.name.asc()))
    return [PlanResponse.model_validate(plan) for plan in result.scalars().all()]


@router.post(
    "/plans",
    response_model=PlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar plano",
)
async def create_plan(
    payload: PlanCreate,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> PlanResponse:
    await _ensure_slug_available(db, payload.slug)
    plan = Plan(**payload.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return PlanResponse.model_validate(plan)


@router.get("/plans/{plan_id}", response_model=PlanResponse, summary="Detalhar plano")
async def get_plan(
    plan_id: UUID,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> PlanResponse:
    plan = await _get_plan(db, plan_id)
    return PlanResponse.model_validate(plan)


@router.patch("/plans/{plan_id}", response_model=PlanResponse, summary="Atualizar plano")
async def update_plan(
    plan_id: UUID,
    payload: PlanUpdate,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> PlanResponse:
    plan = await _get_plan(db, plan_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != plan.slug:
        await _ensure_slug_available(db, update_data["slug"])
    for field, value in update_data.items():
        setattr(plan, field, value)
    await db.commit()
    await db.refresh(plan)
    return PlanResponse.model_validate(plan)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Desativar plano")
async def delete_plan(
    plan_id: UUID,
    current_user: RequestUser = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    plan = await _get_plan(db, plan_id)
    plan.is_active = False
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


async def _get_company(db: AsyncSession, company_id: UUID) -> Company:
    result = await db.execute(
        select(Company)
        .options(
            selectinload(Company.billing_history),
            joinedload(Company.subscription).joinedload(Subscription.plan),
        )
        .where(Company.id == company_id, Company.deleted_at.is_(None))
    )
    company = result.scalar_one_or_none()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")
    return company


async def _get_plan(db: AsyncSession, plan_id: UUID) -> Plan:
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado.")
    return plan


async def _resolve_plan_id(db: AsyncSession, payload: ChangeCompanyPlanRequest) -> UUID:
    if payload.plan_id is not None:
        return payload.plan_id
    if payload.plan_slug is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Informe plan_id ou plan_slug.")

    result = await db.execute(
        select(Plan.id).where(
            Plan.slug == payload.plan_slug,
            Plan.is_active.is_(True),
        )
    )
    plan_id = result.scalar_one_or_none()
    if plan_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado.")
    return plan_id


async def _ensure_slug_available(db: AsyncSession, slug: str) -> None:
    result = await db.execute(select(Plan.id).where(Plan.slug == slug))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug de plano já cadastrado.")


async def _billing_history(db: AsyncSession, company_id: UUID) -> list[BillingHistoryResponse]:
    result = await db.execute(
        select(BillingHistory)
        .where(BillingHistory.company_id == company_id)
        .order_by(BillingHistory.created_at.desc())
    )
    return [BillingHistoryResponse.model_validate(item) for item in result.scalars().all()]


async def _usage_details(db: AsyncSession, subscription: Subscription) -> UsageDetails:
    users_count = await _count_users(db, subscription.company_id)
    products_count = await _count_products(db, subscription.company_id)
    sales_count = await _count_sales_this_month(db, subscription.company_id)
    plan = subscription.plan
    return UsageDetails.model_validate(
        {
            "users": _usage_row(users_count, plan.max_users),
            "products": _usage_row(products_count, plan.max_products),
            "sales_per_month": _usage_row(sales_count, plan.max_sales_per_month),
        }
    )


async def _count_users(db: AsyncSession, company_id: UUID) -> int:
    result = await db.execute(
        select(func.count(User.id)).where(
            User.company_id == company_id,
            User.deleted_at.is_(None),
            User.is_active.is_(True),
        )
    )
    return int(result.scalar_one())


async def _count_products(db: AsyncSession, company_id: UUID) -> int:
    result = await db.execute(
        select(func.count(Product.id)).where(
            Product.company_id == company_id,
            Product.deleted_at.is_(None),
        )
    )
    return int(result.scalar_one())


async def _count_sales_this_month(db: AsyncSession, company_id: UUID) -> int:
    now = datetime.now(tz=UTC)
    month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
    if now.month == 12:
        next_month = datetime(now.year + 1, 1, 1, tzinfo=UTC)
    else:
        next_month = datetime(now.year, now.month + 1, 1, tzinfo=UTC)

    result = await db.execute(
        select(func.count(Sale.id)).where(
            Sale.company_id == company_id,
            Sale.issued_at >= month_start,
            Sale.issued_at < next_month,
        )
    )
    return int(result.scalar_one())


def _company_list_item(company: Company) -> AdminCompanyListItem:
    return AdminCompanyListItem.model_validate(
        {
            "company": company,
            "is_active": company.is_active,
            "created_at": company.created_at,
            "subscription": company.subscription,
        }
    )


def _usage_row(current: int, limit: int) -> dict[str, int | float]:
    percentage = 0.0 if limit <= 0 else round((current / limit) * 100, 2)
    return {"current": current, "limit": limit, "percentage": percentage}
