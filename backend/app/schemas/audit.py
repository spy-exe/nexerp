from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: UUID
    company_id: UUID
    user_id: UUID | None
    action: str
    table_name: str
    record_id: str
    old_data: dict | None
    new_data: dict | None
    ip_address: str | None
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
