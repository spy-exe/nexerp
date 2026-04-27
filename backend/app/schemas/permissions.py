from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class PermissionDefinition(BaseModel):
    code: str
    module: str
    description: str


class RolePermissionResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    permissions: list[str]
    is_system: bool

    model_config = {"from_attributes": True}


class RolePermissionUpdate(BaseModel):
    permissions: list[str] = Field(min_length=1)
