from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.advanced_reports import AdvancedFinancialReport, AdvancedSalesReport, AdvancedStockReport
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/advanced/sales", response_model=AdvancedSalesReport, summary="Relatório avançado de vendas")
async def advanced_sales_report(
    current_user: RequestUser = Depends(require_permission("reports:read")),
    db: AsyncSession = Depends(get_db),
) -> AdvancedSalesReport:
    return await ReportService(db).sales_report(current_user.company_id)


@router.get("/advanced/stock", response_model=AdvancedStockReport, summary="Relatório avançado de estoque")
async def advanced_stock_report(
    current_user: RequestUser = Depends(require_permission("reports:read")),
    db: AsyncSession = Depends(get_db),
) -> AdvancedStockReport:
    return await ReportService(db).stock_report(current_user.company_id)


@router.get("/advanced/financial", response_model=AdvancedFinancialReport, summary="Relatório avançado financeiro")
async def advanced_financial_report(
    current_user: RequestUser = Depends(require_permission("reports:read")),
    db: AsyncSession = Depends(get_db),
) -> AdvancedFinancialReport:
    return await ReportService(db).financial_report(current_user.company_id)
