from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.purchase import PurchaseCreate, PurchaseDetailResponse, PurchaseSummaryResponse, PurchaseUpdate
from app.services.purchase_service import PurchaseService

router = APIRouter(prefix="/purchases", tags=["purchases"])


def serialize_purchase_summary(purchase) -> PurchaseSummaryResponse:
    return PurchaseSummaryResponse(
        id=purchase.id,
        company_id=purchase.company_id,
        purchase_number=purchase.purchase_number,
        supplier_id=purchase.supplier_id,
        user_id=purchase.user_id,
        warehouse_id=purchase.warehouse_id,
        status=purchase.status,
        issued_at=purchase.issued_at,
        subtotal=purchase.subtotal,
        total_amount=purchase.total_amount,
        notes=purchase.notes,
        supplier_name=purchase.supplier.name if getattr(purchase, "supplier", None) else None,
    )


@router.get("", response_model=list[PurchaseSummaryResponse], summary="Listar compras")
async def list_purchases(
    current_user: RequestUser = Depends(require_permission("purchases:read")),
    db: AsyncSession = Depends(get_db),
) -> list[PurchaseSummaryResponse]:
    service = PurchaseService(db)
    purchases = await service.list(current_user.company_id)
    return [serialize_purchase_summary(purchase) for purchase in purchases]


@router.get("/{purchase_id}", response_model=PurchaseDetailResponse, summary="Detalhar compra")
async def get_purchase(
    purchase_id: UUID,
    current_user: RequestUser = Depends(require_permission("purchases:read")),
    db: AsyncSession = Depends(get_db),
) -> PurchaseDetailResponse:
    service = PurchaseService(db)
    purchase = await service.get(current_user.company_id, purchase_id)
    return PurchaseDetailResponse(
        **serialize_purchase_summary(purchase).model_dump(),
        items=purchase.items,
    )


@router.post("", response_model=PurchaseDetailResponse, status_code=status.HTTP_201_CREATED, summary="Registrar compra")
async def create_purchase(
    payload: PurchaseCreate,
    current_user: RequestUser = Depends(require_permission("purchases:create")),
    db: AsyncSession = Depends(get_db),
) -> PurchaseDetailResponse:
    service = PurchaseService(db)
    purchase = await service.create(current_user.company_id, current_user.id, payload, None)
    return PurchaseDetailResponse(
        **serialize_purchase_summary(purchase).model_dump(),
        items=purchase.items,
    )


@router.patch("/{purchase_id}", response_model=PurchaseDetailResponse, summary="Atualizar compra")
async def update_purchase(
    purchase_id: UUID,
    payload: PurchaseUpdate,
    current_user: RequestUser = Depends(require_permission("purchases:update")),
    db: AsyncSession = Depends(get_db),
) -> PurchaseDetailResponse:
    service = PurchaseService(db)
    purchase = await service.update(current_user.company_id, purchase_id, current_user.id, payload, None)
    return PurchaseDetailResponse(
        **serialize_purchase_summary(purchase).model_dump(),
        items=purchase.items,
    )
