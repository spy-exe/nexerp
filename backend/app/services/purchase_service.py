from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.party import BusinessParty, PartyKind
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.stock import Warehouse
from app.schemas.purchase import PurchaseCreate, PurchaseUpdate
from app.services.audit_service import AuditService
from app.services.stock_service import StockService


MONEY_PRECISION = Decimal("0.01")
EDITABLE_STATUSES = {"draft", "confirmed"}


class PurchaseService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)
        self.stock = StockService(db)

    async def list(self, company_id: UUID) -> list[Purchase]:
        result = await self.db.execute(
            select(Purchase)
            .options(joinedload(Purchase.supplier))
            .where(Purchase.company_id == company_id)
            .order_by(Purchase.issued_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get(self, company_id: UUID, purchase_id: UUID) -> Purchase:
        result = await self.db.execute(
            select(Purchase)
            .options(joinedload(Purchase.supplier), selectinload(Purchase.items))
            .where(Purchase.company_id == company_id, Purchase.id == purchase_id)
        )
        purchase = result.scalar_one_or_none()
        if purchase is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra não encontrada.")
        return purchase

    async def create(
        self,
        company_id: UUID,
        user_id: UUID,
        payload: PurchaseCreate,
        ip_address: str | None,
    ) -> Purchase:
        warehouse = await self._resolve_warehouse(company_id, payload.warehouse_id)
        supplier = await self._resolve_supplier(company_id, payload.supplier_id)
        products = await self._load_products(company_id, [UUID(item.product_id) for item in payload.items])

        subtotal = Decimal("0.00")
        item_rows: list[PurchaseItem] = []
        for item in payload.items:
            product = products[UUID(item.product_id)]
            line_total = self._money(item.quantity * item.unit_cost)
            subtotal += line_total
            item_rows.append(
                PurchaseItem(
                    company_id=company_id,
                    product_id=product.id,
                    product_name=product.name,
                    product_sku=product.sku,
                    unit=product.unit,
                    quantity=item.quantity,
                    unit_cost=item.unit_cost,
                    total_cost=line_total,
                )
            )

        purchase = Purchase(
            company_id=company_id,
            purchase_number=self._build_number("COM"),
            supplier_id=supplier.id,
            user_id=user_id,
            warehouse_id=warehouse.id,
            status="received",
            issued_at=datetime.now(tz=UTC),
            subtotal=self._money(subtotal),
            total_amount=self._money(subtotal),
            notes=payload.notes,
        )
        self.db.add(purchase)
        await self.db.flush()

        for item_row in item_rows:
            item_row.purchase_id = purchase.id
            self.db.add(item_row)

        for item in payload.items:
            product = products[UUID(item.product_id)]
            await self.stock.record_system_movement(
                company_id=company_id,
                user_id=user_id,
                product_id=product.id,
                movement_type="inbound",
                quantity=item.quantity,
                warehouse_id=warehouse.id,
                reference_id=str(purchase.id),
                reference_type="purchase",
                notes=f"Compra {purchase.purchase_number}",
                audit_action="stock.purchase.inbound",
                ip_address=ip_address,
            )

        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="purchases.created",
            table_name="purchases",
            record_id=str(purchase.id),
            new_data={
                "purchase_number": purchase.purchase_number,
                "supplier_id": str(supplier.id),
                "warehouse_id": str(warehouse.id),
                "subtotal": str(purchase.subtotal),
                "total_amount": str(purchase.total_amount),
                "items": [item.model_dump(mode="json") for item in payload.items],
            },
            ip_address=ip_address,
        )
        await self.db.commit()
        return await self.get(company_id, purchase.id)

    async def update(
        self,
        company_id: UUID,
        purchase_id: UUID,
        user_id: UUID,
        payload: PurchaseUpdate,
        ip_address: str | None,
    ) -> Purchase:
        purchase = await self.get(company_id, purchase_id)
        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return purchase

        if "status" in update_data and update_data["status"] != purchase.status:
            if purchase.status not in EDITABLE_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Status de compra finalizada não pode ser alterado.",
                )

        previous = {
            "status": purchase.status,
            "notes": purchase.notes,
        }
        for field, value in update_data.items():
            setattr(purchase, field, value)
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="purchases.updated",
            table_name="purchases",
            record_id=str(purchase.id),
            old_data=previous,
            new_data=payload.model_dump(exclude_unset=True, mode="json"),
            ip_address=ip_address,
        )
        await self.db.commit()
        return await self.get(company_id, purchase.id)

    async def _resolve_supplier(self, company_id: UUID, supplier_id: str) -> BusinessParty:
        result = await self.db.execute(
            select(BusinessParty).where(
                BusinessParty.id == UUID(supplier_id),
                BusinessParty.company_id == company_id,
                BusinessParty.kind == PartyKind.SUPPLIER.value,
                BusinessParty.deleted_at.is_(None),
                BusinessParty.is_active.is_(True),
            )
        )
        supplier = result.scalar_one_or_none()
        if supplier is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fornecedor não encontrado.")
        return supplier

    async def _resolve_warehouse(self, company_id: UUID, warehouse_id: str | None) -> Warehouse:
        if warehouse_id is None:
            return await self.stock.get_default_warehouse(company_id)
        return await self.stock._get_warehouse(company_id, UUID(warehouse_id))

    async def _load_products(self, company_id: UUID, product_ids: Sequence[UUID]) -> dict[UUID, Product]:
        result = await self.db.execute(
            select(Product).where(
                Product.company_id == company_id,
                Product.id.in_(product_ids),
                Product.deleted_at.is_(None),
                Product.is_active.is_(True),
            )
        )
        products = {product.id: product for product in result.scalars().all()}
        if len(products) != len(set(product_ids)):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto inválido na compra.")
        return products

    @staticmethod
    def _build_number(prefix: str) -> str:
        timestamp = datetime.now(tz=UTC).strftime("%Y%m%d%H%M%S")
        return f"{prefix}-{timestamp}-{uuid4().hex[:6].upper()}"

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(MONEY_PRECISION, rounding=ROUND_HALF_UP)
