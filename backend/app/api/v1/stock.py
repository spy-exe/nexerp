from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.stock import StockBalanceResponse, StockMovementCreate, StockMovementResponse, WarehouseUpdate
from app.services.stock_service import StockService

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/balances", response_model=list[StockBalanceResponse], summary="Listar saldo de estoque")
async def list_balances(
    current_user: RequestUser = Depends(require_permission("stock:read")),
    db: AsyncSession = Depends(get_db),
) -> list[StockBalanceResponse]:
    service = StockService(db)
    balances = await service.list_balances(current_user.company_id)
    return [
        StockBalanceResponse(
            product_id=str(balance.product_id),
            product_name=balance.product.name,
            warehouse_id=str(balance.warehouse_id),
            warehouse_name=balance.warehouse.name,
            warehouse_location=balance.warehouse.location,
            quantity=balance.quantity,
            min_stock=balance.product.min_stock,
        )
        for balance in balances
    ]


@router.post("/movements", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED, summary="Registrar movimentação de estoque")
async def create_movement(
    payload: StockMovementCreate,
    current_user: RequestUser = Depends(require_permission("stock:adjust")),
    db: AsyncSession = Depends(get_db),
) -> StockMovementResponse:
    service = StockService(db)
    movement = await service.create_movement(current_user.company_id, current_user.id, payload, None)
    return StockMovementResponse.model_validate(movement)


@router.patch("/warehouses/{warehouse_id}", summary="Atualizar depósito")
async def update_warehouse(
    warehouse_id: UUID,
    payload: WarehouseUpdate,
    current_user: RequestUser = Depends(require_permission("stock:adjust")),
    db: AsyncSession = Depends(get_db),
):
    service = StockService(db)
    warehouse = await service.update_warehouse(current_user.company_id, warehouse_id, current_user.id, payload, None)
    return {
        "id": warehouse.id,
        "name": warehouse.name,
        "location": warehouse.location,
        "is_default": warehouse.is_default,
    }
