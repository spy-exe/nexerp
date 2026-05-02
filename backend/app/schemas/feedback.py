from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    message: str = Field(min_length=3, max_length=2000)
    rating: int | None = Field(default=None, ge=1, le=5)


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    user_id: UUID | None = None
    company_name: str | None = None
    user_email: str | None = None
    message: str
    rating: int | None = None
    created_at: datetime
