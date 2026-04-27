from __future__ import annotations

from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.finance import FinancialTransaction, Installment
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.stock import StockBalance, Warehouse
from app.schemas.advanced_reports import (
    AdvancedFinancialReport,
    AdvancedSalesReport,
    AdvancedStockReport,
    AdvancedStockReportItem,
    SalesReportItem,
)


MONEY_PRECISION = Decimal("0.01")


class ReportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def sales_report(self, company_id: UUID) -> AdvancedSalesReport:
        sales_result = await self.db.execute(
            select(Sale)
            .options(joinedload(Sale.customer))
            .where(Sale.company_id == company_id, Sale.status == "completed")
        )
        sales = list(sales_result.scalars().unique().all())
        total_revenue = self._money(sum(sale.total_amount for sale in sales))
        average_ticket = self._money(total_revenue / len(sales)) if sales else Decimal("0.00")

        items_result = await self.db.execute(
            select(SaleItem).join(Sale, Sale.id == SaleItem.sale_id).where(Sale.company_id == company_id)
        )
        product_quantities: dict[UUID, Decimal] = defaultdict(lambda: Decimal("0.00"))
        product_totals: dict[UUID, Decimal] = defaultdict(lambda: Decimal("0.00"))
        product_labels: dict[UUID, str] = {}
        for item in items_result.scalars().all():
            product_quantities[item.product_id] += Decimal(item.quantity)
            product_totals[item.product_id] += Decimal(item.total_amount)
            product_labels[item.product_id] = item.product_name

        customer_totals: dict[UUID, Decimal] = defaultdict(lambda: Decimal("0.00"))
        customer_labels: dict[UUID, str] = {}
        for sale in sales:
            if sale.customer_id is None or sale.customer is None:
                continue
            customer_totals[sale.customer_id] += Decimal(sale.total_amount)
            customer_labels[sale.customer_id] = sale.customer.name

        return AdvancedSalesReport(
            total_revenue=total_revenue,
            total_sales=len(sales),
            average_ticket=average_ticket,
            top_products=[
                SalesReportItem(
                    id=product_id,
                    label=product_labels[product_id],
                    quantity=self._money(quantity),
                    total=self._money(product_totals[product_id]),
                )
                for product_id, quantity in sorted(product_quantities.items(), key=lambda pair: pair[1], reverse=True)[:10]
            ],
            top_customers=[
                SalesReportItem(
                    id=customer_id,
                    label=customer_labels[customer_id],
                    quantity=Decimal("0.00"),
                    total=self._money(total),
                )
                for customer_id, total in sorted(customer_totals.items(), key=lambda pair: pair[1], reverse=True)[:10]
            ],
        )

    async def stock_report(self, company_id: UUID) -> AdvancedStockReport:
        result = await self.db.execute(
            select(StockBalance, Product, Warehouse)
            .join(Product, Product.id == StockBalance.product_id)
            .join(Warehouse, Warehouse.id == StockBalance.warehouse_id)
            .where(
                StockBalance.company_id == company_id,
                Product.company_id == company_id,
                Warehouse.company_id == company_id,
                Product.deleted_at.is_(None),
            )
        )
        items: list[AdvancedStockReportItem] = []
        for balance, product, warehouse in result.all():
            status = "low_stock" if balance.quantity <= product.min_stock else "ok"
            items.append(
                AdvancedStockReportItem(
                    product_id=product.id,
                    product_name=product.name,
                    sku=product.sku,
                    warehouse_id=warehouse.id,
                    warehouse_name=warehouse.name,
                    quantity=Decimal(balance.quantity),
                    min_stock=Decimal(product.min_stock),
                    status=status,
                )
            )
        return AdvancedStockReport(
            total_products=len({item.product_id for item in items}),
            low_stock_count=sum(1 for item in items if item.status == "low_stock"),
            items=items,
        )

    async def financial_report(self, company_id: UUID) -> AdvancedFinancialReport:
        transactions_result = await self.db.execute(
            select(FinancialTransaction).where(
                FinancialTransaction.company_id == company_id,
                FinancialTransaction.deleted_at.is_(None),
                FinancialTransaction.is_active.is_(True),
            )
        )
        income = Decimal("0.00")
        expense = Decimal("0.00")
        for transaction in transactions_result.scalars().all():
            if transaction.type == "income":
                income += Decimal(transaction.amount)
            if transaction.type == "expense":
                expense += Decimal(transaction.amount)

        installments_result = await self.db.execute(
            select(Installment).where(
                Installment.company_id == company_id,
                Installment.deleted_at.is_(None),
                Installment.is_active.is_(True),
                Installment.status.in_(("open", "partial", "overdue")),
            )
        )
        receivables_open = Decimal("0.00")
        payables_open = Decimal("0.00")
        for installment in installments_result.scalars().all():
            remaining = Decimal(installment.total_amount) - Decimal(installment.paid_amount)
            if installment.type == "income":
                receivables_open += remaining
            if installment.type == "expense":
                payables_open += remaining

        return AdvancedFinancialReport(
            income=self._money(income),
            expense=self._money(expense),
            net=self._money(income - expense),
            receivables_open=self._money(receivables_open),
            payables_open=self._money(payables_open),
        )

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(MONEY_PRECISION, rounding=ROUND_HALF_UP)
