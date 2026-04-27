from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BusinessPartyCreate(BaseModel):
    person_kind: str = Field(pattern="^(individual|company)$")
    name: str = Field(min_length=2, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    document_number: str = Field(min_length=11, max_length=18)
    state_registration: str | None = Field(default=None, max_length=30)
    municipal_registration: str | None = Field(default=None, max_length=30)
    address_zip: str | None = Field(default=None, max_length=9)
    address_state: str | None = Field(default=None, min_length=2, max_length=2)
    address_city: str | None = Field(default=None, max_length=120)
    address_street: str | None = Field(default=None, max_length=255)
    address_number: str | None = Field(default=None, max_length=30)
    address_neighborhood: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=500)


class BusinessPartyUpdate(BaseModel):
    person_kind: str | None = Field(default=None, pattern="^(individual|company)$")
    name: str | None = Field(default=None, min_length=2, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    document_number: str | None = Field(default=None, min_length=11, max_length=18)
    state_registration: str | None = Field(default=None, max_length=30)
    municipal_registration: str | None = Field(default=None, max_length=30)
    address_zip: str | None = Field(default=None, max_length=9)
    address_state: str | None = Field(default=None, min_length=2, max_length=2)
    address_city: str | None = Field(default=None, max_length=120)
    address_street: str | None = Field(default=None, max_length=255)
    address_number: str | None = Field(default=None, max_length=30)
    address_neighborhood: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class BusinessPartyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    kind: str
    person_kind: str
    name: str
    email: str | None = None
    phone: str | None = None
    document_number: str
    state_registration: str | None = None
    municipal_registration: str | None = None
    address_zip: str | None = None
    address_state: str | None = None
    address_city: str | None = None
    address_street: str | None = None
    address_number: str | None = None
    address_neighborhood: str | None = None
    notes: str | None = None
    is_active: bool
