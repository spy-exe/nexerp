from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse, summary="Obter KPIs comerciais")
async def get_dashboard_overview(
    current_user: RequestUser = Depends(require_permission("dashboard:read")),
    db: AsyncSession = Depends(get_db),
) -> DashboardOverviewResponse:
    service = DashboardService(db)
    return await service.overview(current_user.company_id)
