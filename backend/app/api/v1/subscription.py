from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_current_user, get_db
from app.schemas.subscription import SubscriptionUsageResponse
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/usage", response_model=SubscriptionUsageResponse, summary="Uso atual da assinatura")
async def subscription_usage(
    current_user: RequestUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionUsageResponse:
    if current_user.company_id is None:
        return SubscriptionUsageResponse.model_validate(
            {
                "plan": {
                    "id": current_user.id,
                    "name": "Superadmin",
                    "slug": "superadmin",
                    "price_monthly": 0,
                    "limits": {"max_users": 0, "max_products": 0, "max_sales_per_month": 0},
                },
                "status": "active",
                "trial_ends_at": None,
                "usage": {
                    "users": {"current": 0, "limit": 0, "percentage": 0},
                    "products": {"current": 0, "limit": 0, "percentage": 0},
                    "sales_per_month": {"current": 0, "limit": 0, "percentage": 0},
                },
            }
        )

    usage = await SubscriptionService(db).get_usage(current_user.company_id)
    return SubscriptionUsageResponse.model_validate(usage)
