from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.sale import SaleCreate, SaleDetailResponse, SaleSummaryResponse
from app.services.sale_service import SaleService

router = APIRouter(prefix="/sales", tags=["sales"])


def serialize_sale_summary(sale) -> SaleSummaryResponse:
    return SaleSummaryResponse(
        id=sale.id,
        company_id=sale.company_id,
        sale_number=sale.sale_number,
        customer_id=sale.customer_id,
        user_id=sale.user_id,
        warehouse_id=sale.warehouse_id,
        status=sale.status,
        channel=sale.channel,
        issued_at=sale.issued_at,
        subtotal=sale.subtotal,
        discount_amount=sale.discount_amount,
        total_amount=sale.total_amount,
        change_amount=sale.change_amount,
        notes=sale.notes,
        customer_name=sale.customer.name if getattr(sale, "customer", None) else None,
    )


@router.get("", response_model=list[SaleSummaryResponse], summary="Listar vendas")
async def list_sales(
    current_user: RequestUser = Depends(require_permission("sales:read")),
    db: AsyncSession = Depends(get_db),
) -> list[SaleSummaryResponse]:
    service = SaleService(db)
    sales = await service.list(current_user.company_id)
    return [serialize_sale_summary(sale) for sale in sales]


@router.get("/{sale_id}", response_model=SaleDetailResponse, summary="Detalhar venda")
async def get_sale(
    sale_id: UUID,
    current_user: RequestUser = Depends(require_permission("sales:read")),
    db: AsyncSession = Depends(get_db),
) -> SaleDetailResponse:
    service = SaleService(db)
    sale = await service.get(current_user.company_id, sale_id)
    return SaleDetailResponse(
        **serialize_sale_summary(sale).model_dump(),
        items=sale.items,
        payments=sale.payments,
    )


@router.post("", response_model=SaleDetailResponse, status_code=status.HTTP_201_CREATED, summary="Criar venda")
async def create_sale(
    payload: SaleCreate,
    current_user: RequestUser = Depends(require_permission("sales:create")),
    db: AsyncSession = Depends(get_db),
) -> SaleDetailResponse:
    service = SaleService(db)
    sale = await service.create(current_user.company_id, current_user.id, payload, None)
    return SaleDetailResponse(
        **serialize_sale_summary(sale).model_dump(),
        items=sale.items,
        payments=sale.payments,
    )
