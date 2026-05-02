from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StockMovementCreate(BaseModel):
    product_id: str
    warehouse_id: str | None = None
    type: str = Field(pattern="^(inbound|outbound|adjustment)$")
    quantity: Decimal = Field(gt=0)
    reference_id: str | None = Field(default=None, max_length=64)
    reference_type: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=500)


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    product_id: UUID
    warehouse_id: UUID
    user_id: UUID
    type: str
    quantity: Decimal
    balance_after: Decimal
    reference_id: str | None = None
    reference_type: str | None = None
    notes: str | None = None


class StockBalanceResponse(BaseModel):
    product_id: UUID
    product_name: str
    warehouse_id: UUID
    warehouse_name: str
    warehouse_location: str | None = None
    quantity: Decimal
    min_stock: Decimal


class WarehouseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    location: str | None = Field(default=None, max_length=255)
