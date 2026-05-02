from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.config import Settings
from app.core.security import (
    build_access_token,
    build_refresh_token,
    decode_token,
    digest_token,
    generate_one_time_token,
    hash_password,
    verify_password,
)
from app.core.token_store import BaseTokenStore
from app.models.company import Company
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.role import Role
from app.models.stock import Warehouse
from app.models.user import User
from app.schemas.auth import (
    AuthSessionResponse,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.schemas.company import CompanyResponse
from app.services.audit_service import AuditService
from app.utils.passwords import validate_password_strength


SYSTEM_ROLES: dict[str, list[str]] = {
    "Admin": ["*"],
    "Gerente": [
        "company:read",
        "company:update",
        "dashboard:read",
        "customers:read",
        "customers:create",
        "customers:update",
        "suppliers:read",
        "suppliers:create",
        "suppliers:update",
        "products:read",
        "products:create",
        "products:update",
        "categories:read",
        "categories:create",
        "categories:update",
        "sales:read",
        "sales:create",
        "sales:update",
        "purchases:read",
        "purchases:create",
        "purchases:update",
        "finance:read",
        "finance:manage",
        "finance:transactions",
        "finance:pay",
        "fiscal:read",
        "fiscal:issue",
        "reports:read",
        "audit:read",
        "permissions:read",
        "permissions:update",
        "stock:read",
        "stock:adjust",
    ],
    "Vendedor": [
        "dashboard:read",
        "customers:read",
        "customers:create",
        "customers:update",
        "products:read",
        "categories:read",
        "stock:read",
        "sales:read",
        "sales:create",
        "finance:read",
        "finance:transactions",
        "fiscal:read",
        "reports:read",
    ],
    "Estoquista": [
        "products:read",
        "categories:read",
        "suppliers:read",
        "stock:read",
        "stock:adjust",
        "purchases:read",
        "purchases:create",
        "finance:read",
        "reports:read",
    ],
    "Financeiro": [
        "company:read",
        "dashboard:read",
        "customers:read",
        "suppliers:read",
        "sales:read",
        "purchases:read",
        "finance:read",
        "finance:manage",
        "finance:transactions",
        "finance:pay",
        "fiscal:read",
        "reports:read",
    ],
    "Visualizador": [
        "company:read",
        "dashboard:read",
        "customers:read",
        "suppliers:read",
        "products:read",
        "categories:read",
        "stock:read",
        "sales:read",
        "purchases:read",
        "finance:read",
        "fiscal:read",
        "reports:read",
    ],
}


class AuthService:
    def __init__(self, db: AsyncSession, settings: Settings, token_store: BaseTokenStore) -> None:
        self.db = db
        self.settings = settings
        self.token_store = token_store
        self.audit = AuditService(db)

    async def register_company_admin(self, payload: RegisterRequest, ip_address: str | None) -> tuple[AuthSessionResponse, str]:
        await self._ensure_company_and_email_available(payload.company.cnpj, payload.company.email, payload.user.email)
        try:
            password_hash = hash_password(payload.user.password)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        company = Company(**payload.company.model_dump())
        self.db.add(company)
        await self.db.flush()

        roles = await self._create_system_roles(company.id)
        user = User(
            company_id=company.id,
            name=payload.user.name,
            email=payload.user.email,
            password_hash=password_hash,
        )
        user.company = company
        user.roles.append(roles["Admin"])

        warehouse = Warehouse(
            company_id=company.id,
            name="Principal",
            location="Matriz",
            is_default=True,
        )
        self.db.add_all([user, warehouse])
        await self.db.flush()

        self.audit.log(
            company_id=company.id,
            user_id=user.id,
            action="auth.registered",
            table_name="companies",
            record_id=str(company.id),
            new_data={
                "company": payload.company.model_dump(mode="json"),
                "user": {"name": payload.user.name, "email": payload.user.email},
            },
            ip_address=ip_address,
        )
        session_response, refresh_token = await self._issue_session(user)
        await self.db.commit()
        await self.db.refresh(user)
        await self.db.refresh(company)
        return session_response, refresh_token

    async def authenticate(self, payload: LoginRequest, ip_address: str | None) -> tuple[AuthSessionResponse, str]:
        user = await self._get_user_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas.")
        if not user.is_active or user.deleted_at is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo.")

        user.last_login = datetime.now(tz=UTC).replace(tzinfo=None)
        self.audit.log(
            company_id=user.company_id,
            user_id=user.id,
            action="auth.login",
            table_name="users",
            record_id=str(user.id),
            ip_address=ip_address,
        )
        session_response, refresh_token = await self._issue_session(user)
        await self.db.commit()
        return session_response, refresh_token

    async def refresh_session(self, refresh_token: str) -> tuple[AuthSessionResponse, str]:
        payload = decode_token(refresh_token, self.settings, "refresh")
        user = await self._get_user_by_id(UUID(str(payload["sub"])))
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.")

        stored = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == payload["jti"]))
        refresh_record = stored.scalar_one_or_none()
        if refresh_record is None or refresh_record.revoked_at is not None or self._is_expired(refresh_record.expires_at):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido.")

        token_hash = digest_token(refresh_token)
        is_active = await self.token_store.validate_refresh_token(str(user.id), payload["jti"], token_hash)
        if not is_active or refresh_record.token_hash != token_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido.")

        refresh_record.revoked_at = datetime.now(tz=UTC)
        refresh_record.last_used_at = datetime.now(tz=UTC)
        await self.token_store.revoke_refresh_token(str(user.id), payload["jti"])

        session_response, new_refresh_token = await self._issue_session(user)
        await self.db.commit()
        return session_response, new_refresh_token

    async def logout(self, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        try:
            payload = decode_token(refresh_token, self.settings, "refresh")
        except HTTPException:
            return

        result = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == payload["jti"]))
        refresh_record = result.scalar_one_or_none()
        if refresh_record is not None and refresh_record.revoked_at is None:
            refresh_record.revoked_at = datetime.now(tz=UTC)
            await self.token_store.revoke_refresh_token(str(payload["sub"]), payload["jti"])
            await self.db.commit()

    async def request_password_reset(self, email: str, ip_address: str | None) -> ForgotPasswordResponse:
        user = await self._get_user_by_email(email)
        if user is None:
            return ForgotPasswordResponse(message="Se o e-mail existir, enviaremos as instruções.")

        raw_token = generate_one_time_token()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=digest_token(raw_token),
            expires_at=datetime.now(tz=UTC) + timedelta(minutes=self.settings.password_reset_expire_minutes),
        )
        self.db.add(reset_token)
        self.audit.log(
            company_id=user.company_id,
            user_id=user.id,
            action="auth.password_reset.requested",
            table_name="password_reset_tokens",
            record_id=str(reset_token.id),
            ip_address=ip_address,
        )
        await self.db.commit()

        return ForgotPasswordResponse(
            message="Se o e-mail existir, enviaremos as instruções.",
            debug_token=raw_token if self.settings.debug_tokens_enabled else None,
        )

    async def reset_password(self, token: str, new_password: str, ip_address: str | None) -> None:
        try:
            validate_password_strength(new_password)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        result = await self.db.execute(
            select(PasswordResetToken)
            .options(joinedload(PasswordResetToken.user).selectinload(User.roles))
            .where(
                PasswordResetToken.token_hash == digest_token(token),
                PasswordResetToken.used_at.is_(None),
            )
        )
        reset_record = result.scalar_one_or_none()
        if reset_record is None or self._is_expired(reset_record.expires_at):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token de reset inválido ou expirado.")

        user = reset_record.user
        user.password_hash = hash_password(new_password)
        reset_record.used_at = datetime.now(tz=UTC)

        tokens_result = await self.db.execute(select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)))
        for refresh_record in tokens_result.scalars().all():
            refresh_record.revoked_at = datetime.now(tz=UTC)
            await self.token_store.revoke_refresh_token(str(user.id), refresh_record.jti)

        self.audit.log(
            company_id=user.company_id,
            user_id=user.id,
            action="auth.password_reset.completed",
            table_name="users",
            record_id=str(user.id),
            ip_address=ip_address,
        )
        await self.db.commit()

    async def _ensure_company_and_email_available(self, cnpj: str, company_email: str, user_email: str) -> None:
        company_result = await self.db.execute(select(Company).where((Company.cnpj == cnpj) | (Company.email == company_email)))
        if company_result.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Empresa já cadastrada.")

        user_result = await self.db.execute(select(User).where(User.email == user_email))
        if user_result.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Usuário já cadastrado.")

    async def _create_system_roles(self, company_id: UUID) -> dict[str, Role]:
        roles: dict[str, Role] = {}
        for role_name, permissions in SYSTEM_ROLES.items():
            role = Role(
                company_id=company_id,
                name=role_name,
                description=f"Papel padrão {role_name.lower()}",
                permissions=permissions,
                is_system=True,
            )
            self.db.add(role)
            roles[role_name] = role
        await self.db.flush()
        return roles

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles), joinedload(User.company))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: str | UUID) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles), joinedload(User.company))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def _issue_session(self, user: User) -> tuple[AuthSessionResponse, str]:
        permissions = sorted(self.collect_permissions(user))
        access_token = build_access_token(
            str(user.id),
            self.settings,
            {
                "company_id": str(user.company_id),
                "email": user.email,
                "permissions": permissions,
            },
        )
        refresh_token = build_refresh_token(
            str(user.id),
            self.settings,
            {
                "company_id": str(user.company_id),
            },
        )
        refresh_payload = decode_token(refresh_token, self.settings, "refresh")
        refresh_record = RefreshToken(
            user_id=user.id,
            jti=refresh_payload["jti"],
            token_hash=digest_token(refresh_token),
            expires_at=datetime.now(tz=UTC) + timedelta(days=self.settings.refresh_token_expire_days),
        )
        self.db.add(refresh_record)
        await self.token_store.store_refresh_token(
            str(user.id),
            refresh_payload["jti"],
            refresh_record.token_hash,
            self.settings.refresh_token_expire_days * 24 * 60 * 60,
        )

        response = AuthSessionResponse(
            access_token=access_token,
            expires_in=self.settings.access_token_expire_minutes * 60,
            permissions=permissions,
            user=UserResponse.model_validate(user),
            company=CompanyResponse.model_validate(user.company),
        )
        return response, refresh_token

    @staticmethod
    def collect_permissions(user: User) -> set[str]:
        permissions: set[str] = set()
        for role in user.roles:
            permissions.update(role.permissions)
        return permissions

    @staticmethod
    def _is_expired(value: datetime) -> bool:
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value <= datetime.now(tz=UTC)
