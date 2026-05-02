from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.company import CompanyRegistration, CompanyResponse


class UserRegistration(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    company: CompanyRegistration
    user: UserRegistration


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    permissions: list[str]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID | None
    name: str
    email: EmailStr
    is_active: bool
    roles: list[RoleResponse]


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    permissions: list[str]
    user: UserResponse
    company: CompanyResponse | None


class CurrentUserResponse(BaseModel):
    user: UserResponse
    company: CompanyResponse | None
    permissions: list[str]


class ForgotPasswordResponse(BaseModel):
    message: str
    debug_token: str | None = None
