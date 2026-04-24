from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.utils.br_documents import validate_cep, validate_cnpj


class CompanyBase(BaseModel):
    trade_name: str = Field(min_length=2, max_length=255)
    legal_name: str = Field(min_length=2, max_length=255)
    cnpj: str
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("cnpj")
    @classmethod
    def validate_company_cnpj(cls, value: str) -> str:
        return validate_cnpj(value)


class CompanyRegistration(CompanyBase):
    pass


class CompanyOnboardingUpdate(BaseModel):
    phone: str | None = Field(default=None, max_length=20)
    address_zip: str | None = None
    address_state: str | None = Field(default=None, min_length=2, max_length=2)
    address_city: str | None = Field(default=None, max_length=120)
    address_street: str | None = Field(default=None, max_length=255)
    address_number: str | None = Field(default=None, max_length=30)
    address_neighborhood: str | None = Field(default=None, max_length=120)
    logo_url: str | None = Field(default=None, max_length=255)
    tax_regime: str | None = Field(default=None, max_length=50)
    cnae: str | None = Field(default=None, max_length=20)
    timezone: str | None = Field(default=None, max_length=80)
    currency: str | None = Field(default=None, min_length=3, max_length=3)

    @field_validator("address_zip")
    @classmethod
    def validate_zip(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return validate_cep(value)


class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan: str
    address_zip: str | None = None
    address_state: str | None = None
    address_city: str | None = None
    address_street: str | None = None
    address_number: str | None = None
    address_neighborhood: str | None = None
    logo_url: str | None = None
    tax_regime: str | None = None
    cnae: str | None = None
    timezone: str
    currency: str
    onboarding_completed: bool
