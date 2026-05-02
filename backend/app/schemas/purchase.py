from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PurchaseItemCreate(BaseModel):
    product_id: str
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class PurchaseCreate(BaseModel):
    supplier_id: str
    warehouse_id: str | None = None
    create_financial_transaction: bool = False
    notes: str | None = Field(default=None, max_length=500)
    items: list[PurchaseItemCreate] = Field(min_length=1)


class PurchaseUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(draft|confirmed|received|cancelled)$")
    notes: str | None = Field(default=None, max_length=500)


class PurchaseItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    product_name: str
    product_sku: str
    unit: str
    quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal


class PurchaseSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    purchase_number: str
    supplier_id: UUID
    user_id: UUID
    warehouse_id: UUID
    status: str
    issued_at: datetime
    subtotal: Decimal
    total_amount: Decimal
    notes: str | None = None
    supplier_name: str | None = None


class PurchaseDetailResponse(PurchaseSummaryResponse):
    items: list[PurchaseItemResponse]
