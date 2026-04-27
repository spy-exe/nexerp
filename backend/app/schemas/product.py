from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=80)
    barcode: str | None = Field(default=None, max_length=80)
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    category_id: str | None = None
    unit: str = Field(default="UN", min_length=1, max_length=20)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    sale_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    min_stock: Decimal = Field(default=Decimal("0.000"), ge=0)


class ProductUpdate(BaseModel):
    barcode: str | None = Field(default=None, max_length=80)
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    category_id: str | None = None
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    cost_price: Decimal | None = Field(default=None, ge=0)
    sale_price: Decimal | None = Field(default=None, ge=0)
    min_stock: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    sku: str
    barcode: str | None = None
    name: str
    description: str | None = None
    category_id: UUID | None = None
    unit: str
    cost_price: Decimal
    sale_price: Decimal
    min_stock: Decimal
    is_active: bool
