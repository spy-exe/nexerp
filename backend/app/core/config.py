from __future__ import annotations

from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "NexERP"
    app_env: Literal["development", "testing", "staging", "production"] = "development"
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    database_url: str = "sqlite+aiosqlite:///./nexerp.db"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "change_me_generate_with_openssl_rand_hex_32"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    password_reset_expire_minutes: int = 60
    global_rate_limit_per_minute: int = 300
    security_headers_enabled: bool = True

    next_public_app_name: str = "NexERP"
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        enable_decoding=False,
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        raise TypeError("ALLOWED_ORIGINS must be a comma-separated string or list.")

    @model_validator(mode="after")
    def validate_production_security(self) -> Self:
        if self.app_env == "production" and "*" in self.allowed_origins:
            raise ValueError("ALLOWED_ORIGINS cannot contain '*' in production.")
        if self.app_env == "production" and self.secret_key.startswith("change_me"):
            raise ValueError("SECRET_KEY must be replaced in production.")
        return self

    @property
    def async_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url

    @property
    def sync_database_url(self) -> str:
        if self.database_url.startswith("postgresql+asyncpg://"):
            return self.database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        if self.database_url.startswith("sqlite+aiosqlite://"):
            return self.database_url.replace("sqlite+aiosqlite://", "sqlite://", 1)
        return self.database_url

    @property
    def cookie_secure(self) -> bool:
        return self.app_env in {"staging", "production"}

    @property
    def debug_tokens_enabled(self) -> bool:
        return self.app_env in {"development", "testing"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
