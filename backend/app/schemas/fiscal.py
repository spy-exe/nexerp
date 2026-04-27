from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class FiscalDocumentResponse(BaseModel):
    id: UUID
    company_id: UUID
    sale_id: UUID
    user_id: UUID
    model: str
    series: str
    number: int
    environment: str
    status: str
    access_key: str
    protocol: str | None
    sefaz_endpoint: str | None
    total_amount: Decimal
    issued_at: datetime
    authorized_at: datetime | None
    response_message: str | None

    model_config = {"from_attributes": True}


class FiscalDocumentDetailResponse(FiscalDocumentResponse):
    xml_content: str


class FiscalIssueRequest(BaseModel):
    environment: str = Field(default="homologation", pattern="^homologation$")
