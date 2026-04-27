from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.stock import StockBalance
from app.models.purchase import Purchase
from app.schemas.dashboard import DashboardAlertItem, DashboardOverviewResponse, DashboardRankingItem


MONEY_PRECISION = Decimal("0.01")


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def overview(self, company_id: UUID) -> DashboardOverviewResponse:
        now = datetime.now(tz=UTC)
        start_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        sales_result = await self.db.execute(
            select(Sale)
            .options(joinedload(Sale.customer))
            .where(Sale.company_id == company_id, Sale.status == "completed")
        )
        sales = list(sales_result.scalars().unique().all())

        purchases_result = await self.db.execute(
            select(Purchase).where(Purchase.company_id == company_id, Purchase.status == "received")
        )
        purchases = list(purchases_result.scalars().all())

        revenue_today = self._money(
            sum(
                sale.total_amount
                for sale in sales
                if self._normalize_datetime(sale.issued_at) >= start_day
            )
        )
        month_sales = [sale for sale in sales if self._normalize_datetime(sale.issued_at) >= start_month]
        revenue_month = self._money(sum(sale.total_amount for sale in month_sales))
        purchases_month = self._money(
            sum(
                purchase.total_amount
                for purchase in purchases
                if self._normalize_datetime(purchase.issued_at) >= start_month
            )
        )
        average_ticket = self._money(revenue_month / len(month_sales)) if month_sales else Decimal("0.00")
        sales_count_today = sum(1 for sale in sales if self._normalize_datetime(sale.issued_at) >= start_day)

        top_products_result = await self.db.execute(
            select(SaleItem)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .where(Sale.company_id == company_id, Sale.status == "completed")
        )
        product_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
        product_names: dict[str, tuple[str, str]] = {}
        for item in top_products_result.scalars().all():
            product_id = str(item.product_id)
            product_totals[product_id] += Decimal(item.quantity)
            product_names[product_id] = (product_id, item.product_name)
        top_products = [
            DashboardRankingItem(id=product_id, label=label, value=self._money(value))
            for product_id, value in sorted(product_totals.items(), key=lambda pair: pair[1], reverse=True)[:5]
            for _, label in [product_names[product_id]]
        ]

        customer_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
        customer_labels: dict[str, str] = {}
        for sale in sales:
            if sale.customer_id is None or sale.customer is None:
                continue
            customer_id = str(sale.customer_id)
            customer_totals[customer_id] += Decimal(sale.total_amount)
            customer_labels[customer_id] = sale.customer.name
        top_customers = [
            DashboardRankingItem(id=customer_id, label=customer_labels[customer_id], value=self._money(value))
            for customer_id, value in sorted(customer_totals.items(), key=lambda pair: pair[1], reverse=True)[:5]
        ]

        low_stock_result = await self.db.execute(
            select(StockBalance, Product)
            .join(Product, Product.id == StockBalance.product_id)
            .where(
                StockBalance.company_id == company_id,
                Product.company_id == company_id,
                Product.deleted_at.is_(None),
                Product.is_active.is_(True),
                StockBalance.quantity <= Product.min_stock,
            )
        )
        low_stock_alerts = [
            DashboardAlertItem(
                product_id=str(product.id),
                product_name=product.name,
                quantity=Decimal(balance.quantity),
                min_stock=Decimal(product.min_stock),
            )
            for balance, product in low_stock_result.all()
        ]

        return DashboardOverviewResponse(
            revenue_today=revenue_today,
            revenue_month=revenue_month,
            purchases_month=purchases_month,
            average_ticket=average_ticket,
            sales_count_today=sales_count_today,
            open_low_stock_alerts=len(low_stock_alerts),
            top_products=top_products,
            top_customers=top_customers,
            low_stock_alerts=low_stock_alerts[:5],
        )

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(MONEY_PRECISION, rounding=ROUND_HALF_UP)

    @staticmethod
    def _normalize_datetime(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value
