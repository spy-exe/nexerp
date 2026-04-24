from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class APIMessage(BaseModel):
    message: str


class APIHealthStatus(BaseModel):
    status: str
    database: str
    redis: str
    timestamp: datetime


class CompanyScopedModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


DecimalValue = Decimal
