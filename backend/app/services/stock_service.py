from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.stock import StockBalance, StockMovement, StockMovementType, Warehouse
from app.schemas.stock import StockMovementCreate
from app.services.audit_service import AuditService


class StockService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get_default_warehouse(self, company_id: UUID) -> Warehouse:
        result = await self.db.execute(
            select(Warehouse).where(
                Warehouse.company_id == company_id,
                Warehouse.is_default.is_(True),
                Warehouse.deleted_at.is_(None),
            )
        )
        warehouse = result.scalar_one_or_none()
        if warehouse is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Depósito padrão não encontrado.")
        return warehouse

    async def list_balances(self, company_id: UUID) -> list[StockBalance]:
        result = await self.db.execute(
            select(StockBalance)
            .options(selectinload(StockBalance.product), selectinload(StockBalance.warehouse))
            .where(StockBalance.company_id == company_id)
            .order_by(StockBalance.updated_at.desc())
        )
        return list(result.scalars().all())

    async def create_movement(
        self,
        company_id: UUID,
        user_id: UUID,
        payload: StockMovementCreate,
        ip_address: str | None,
    ) -> StockMovement:
        warehouse = (
            await self.get_default_warehouse(company_id)
            if payload.warehouse_id is None
            else await self._get_warehouse(company_id, UUID(payload.warehouse_id))
        )
        product = await self._get_product(company_id, UUID(payload.product_id))

        balance = await self._get_or_create_balance(company_id, product.id, warehouse.id)
        delta = self._calculate_delta(payload.type, payload.quantity)
        new_quantity = Decimal(balance.quantity) + delta
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Estoque insuficiente para realizar a movimentação.",
            )

        balance.quantity = new_quantity
        balance.updated_at = datetime.now(tz=UTC)
        movement = StockMovement(
            company_id=company_id,
            product_id=product.id,
            warehouse_id=warehouse.id,
            user_id=user_id,
            type=payload.type,
            quantity=payload.quantity,
            balance_after=new_quantity,
            reference_id=payload.reference_id,
            reference_type=payload.reference_type,
            notes=payload.notes,
        )
        self.db.add(movement)
        await self.db.flush()
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="stock.movement.created",
            table_name="stock_movements",
            record_id=str(movement.id),
            new_data=payload.model_dump(mode="json") | {"balance_after": str(new_quantity)},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(movement)
        return movement

    async def _get_product(self, company_id: UUID, product_id: UUID) -> Product:
        result = await self.db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.company_id == company_id,
                Product.deleted_at.is_(None),
            )
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
        return product

    async def _get_warehouse(self, company_id: UUID, warehouse_id: UUID) -> Warehouse:
        result = await self.db.execute(
            select(Warehouse).where(
                Warehouse.id == warehouse_id,
                Warehouse.company_id == company_id,
                Warehouse.deleted_at.is_(None),
            )
        )
        warehouse = result.scalar_one_or_none()
        if warehouse is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Depósito não encontrado.")
        return warehouse

    async def _get_or_create_balance(self, company_id: UUID, product_id: UUID, warehouse_id: UUID) -> StockBalance:
        result = await self.db.execute(
            select(StockBalance).where(
                StockBalance.company_id == company_id,
                StockBalance.product_id == product_id,
                StockBalance.warehouse_id == warehouse_id,
            )
        )
        balance = result.scalar_one_or_none()
        if balance is not None:
            return balance
        balance = StockBalance(
            company_id=company_id,
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=Decimal("0.000"),
        )
        self.db.add(balance)
        await self.db.flush()
        return balance

    @staticmethod
    def _calculate_delta(movement_type: str, quantity: Decimal) -> Decimal:
        if movement_type == StockMovementType.INBOUND.value:
            return quantity
        if movement_type == StockMovementType.OUTBOUND.value:
            return quantity * Decimal("-1")
        if movement_type == StockMovementType.ADJUSTMENT.value:
            return quantity
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Tipo de movimentação inválido.")
