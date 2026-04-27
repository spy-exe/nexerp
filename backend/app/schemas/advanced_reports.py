from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class SalesReportItem(BaseModel):
    id: UUID
    label: str
    quantity: Decimal
    total: Decimal


class AdvancedSalesReport(BaseModel):
    total_revenue: Decimal
    total_sales: int
    average_ticket: Decimal
    top_products: list[SalesReportItem]
    top_customers: list[SalesReportItem]


class AdvancedStockReportItem(BaseModel):
    product_id: UUID
    product_name: str
    sku: str
    warehouse_id: UUID
    warehouse_name: str
    quantity: Decimal
    min_stock: Decimal
    status: str


class AdvancedStockReport(BaseModel):
    total_products: int
    low_stock_count: int
    items: list[AdvancedStockReportItem]


class AdvancedFinancialReport(BaseModel):
    income: Decimal
    expense: Decimal
    net: Decimal
    receivables_open: Decimal
    payables_open: Decimal
