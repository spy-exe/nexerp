from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel


class DashboardMetric(BaseModel):
    label: str
    value: Decimal


class DashboardRankingItem(BaseModel):
    id: str
    label: str
    value: Decimal


class DashboardAlertItem(BaseModel):
    product_id: str
    product_name: str
    quantity: Decimal
    min_stock: Decimal


class DashboardOverviewResponse(BaseModel):
    revenue_today: Decimal
    revenue_month: Decimal
    purchases_month: Decimal
    average_ticket: Decimal
    sales_count_today: int
    open_low_stock_alerts: int
    top_products: list[DashboardRankingItem]
    top_customers: list[DashboardRankingItem]
    low_stock_alerts: list[DashboardAlertItem]
