from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.party import BusinessParty, PartyKind
from app.models.product import Product
from app.models.sale import Sale, SaleItem, SalePayment
from app.models.stock import Warehouse
from app.schemas.sale import SaleCreate
from app.services.audit_service import AuditService
from app.services.stock_service import StockService
from app.services.subscription_service import SubscriptionService


MONEY_PRECISION = Decimal("0.01")


class SaleService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)
        self.stock = StockService(db)

    async def list(self, company_id: UUID) -> list[Sale]:
        result = await self.db.execute(
            select(Sale)
            .options(joinedload(Sale.customer))
            .where(Sale.company_id == company_id)
            .order_by(Sale.issued_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get(self, company_id: UUID, sale_id: UUID) -> Sale:
        result = await self.db.execute(
            select(Sale)
            .options(joinedload(Sale.customer), selectinload(Sale.items), selectinload(Sale.payments))
            .where(Sale.company_id == company_id, Sale.id == sale_id)
        )
        sale = result.scalar_one_or_none()
        if sale is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda não encontrada.")
        return sale

    async def create(
        self,
        company_id: UUID,
        user_id: UUID,
        payload: SaleCreate,
        ip_address: str | None,
    ) -> Sale:
        current_count = await self._count_sales_this_month(company_id)
        await SubscriptionService(self.db).check_limit(company_id, "sales_per_month", current_count)

        warehouse = await self._resolve_warehouse(company_id, payload.warehouse_id)
        customer = await self._resolve_customer(company_id, payload.customer_id)
        products = await self._load_products(company_id, [UUID(item.product_id) for item in payload.items])

        subtotal = Decimal("0.00")
        items_total = Decimal("0.00")
        item_rows: list[SaleItem] = []
        for item in payload.items:
            product = products[UUID(item.product_id)]
            line_subtotal = self._money(item.quantity * item.unit_price)
            line_total = self._money(line_subtotal - item.discount_amount)
            if line_total < 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="O desconto do item não pode ser maior que o subtotal da linha.",
                )
            subtotal += line_subtotal
            items_total += line_total
            item_rows.append(
                SaleItem(
                    company_id=company_id,
                    product_id=product.id,
                    product_name=product.name,
                    product_sku=product.sku,
                    unit=product.unit,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    discount_amount=item.discount_amount,
                    total_amount=line_total,
                )
            )

        total_amount = self._money(items_total - payload.discount_amount)
        if total_amount < 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Desconto global inválido.")

        payments_total = self._money(sum(payment.amount for payment in payload.payments))
        if payments_total < total_amount:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O total pago não pode ser menor que o total da venda.",
            )
        change_amount = self._money(payments_total - total_amount)

        sale = Sale(
            company_id=company_id,
            sale_number=self._build_number("VEN"),
            customer_id=customer.id if customer else None,
            user_id=user_id,
            warehouse_id=warehouse.id,
            status="completed",
            channel=payload.channel,
            issued_at=datetime.now(tz=UTC),
            subtotal=self._money(subtotal),
            discount_amount=self._money(payload.discount_amount),
            total_amount=total_amount,
            change_amount=change_amount,
            notes=payload.notes,
        )
        self.db.add(sale)
        await self.db.flush()

        for item_row in item_rows:
            item_row.sale_id = sale.id
            self.db.add(item_row)

        for payment in payload.payments:
            self.db.add(
                SalePayment(
                    company_id=company_id,
                    sale_id=sale.id,
                    method=payment.method,
                    amount=self._money(payment.amount),
                    note=payment.note,
                )
            )

        for item in payload.items:
            product = products[UUID(item.product_id)]
            await self.stock.record_system_movement(
                company_id=company_id,
                user_id=user_id,
                product_id=product.id,
                movement_type="outbound",
                quantity=item.quantity,
                warehouse_id=warehouse.id,
                reference_id=str(sale.id),
                reference_type="sale",
                notes=f"Venda {sale.sale_number}",
                audit_action="stock.sale.outbound",
                ip_address=ip_address,
            )

        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="sales.created",
            table_name="sales",
            record_id=str(sale.id),
            new_data={
                "sale_number": sale.sale_number,
                "customer_id": str(customer.id) if customer else None,
                "warehouse_id": str(warehouse.id),
                "subtotal": str(sale.subtotal),
                "discount_amount": str(sale.discount_amount),
                "total_amount": str(sale.total_amount),
                "change_amount": str(sale.change_amount),
                "items": [item.model_dump(mode="json") for item in payload.items],
                "payments": [payment.model_dump(mode="json") for payment in payload.payments],
                "channel": payload.channel,
            },
            ip_address=ip_address,
        )
        await self.db.commit()
        return await self.get(company_id, sale.id)

    async def _resolve_customer(self, company_id: UUID, customer_id: str | None) -> BusinessParty | None:
        if customer_id is None:
            return None
        result = await self.db.execute(
            select(BusinessParty).where(
                BusinessParty.id == UUID(customer_id),
                BusinessParty.company_id == company_id,
                BusinessParty.kind == PartyKind.CUSTOMER.value,
                BusinessParty.deleted_at.is_(None),
                BusinessParty.is_active.is_(True),
            )
        )
        customer = result.scalar_one_or_none()
        if customer is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
        return customer

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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto inválido na venda.")
        return products

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
    def _build_number(prefix: str) -> str:
        timestamp = datetime.now(tz=UTC).strftime("%Y%m%d%H%M%S")
        return f"{prefix}-{timestamp}-{uuid4().hex[:6].upper()}"

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(MONEY_PRECISION, rounding=ROUND_HALF_UP)
