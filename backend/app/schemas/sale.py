from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)


class SalePaymentCreate(BaseModel):
    method: str = Field(pattern="^(cash|card|pix|credit)$")
    amount: Decimal = Field(gt=0)
    note: str | None = Field(default=None, max_length=255)


class SaleCreate(BaseModel):
    customer_id: str | None = None
    warehouse_id: str | None = None
    channel: str = Field(default="sales", pattern="^(sales|pos)$")
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: str | None = Field(default=None, max_length=500)
    items: list[SaleItemCreate] = Field(min_length=1)
    payments: list[SalePaymentCreate] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    product_name: str
    product_sku: str
    unit: str
    quantity: Decimal
    unit_price: Decimal
    discount_amount: Decimal
    total_amount: Decimal


class SalePaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    method: str
    amount: Decimal
    note: str | None = None


class SaleSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    sale_number: str
    customer_id: UUID | None = None
    user_id: UUID
    warehouse_id: UUID
    status: str
    channel: str
    issued_at: datetime
    subtotal: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    change_amount: Decimal
    notes: str | None = None
    customer_name: str | None = None


class SaleDetailResponse(SaleSummaryResponse):
    items: list[SaleItemResponse]
    payments: list[SalePaymentResponse]
