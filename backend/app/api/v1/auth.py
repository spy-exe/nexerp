from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.dependencies import enforce_rate_limit, get_client_ip, get_current_user, get_db, get_settings
from app.schemas.auth import (
    AuthSessionResponse,
    CurrentUserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def set_refresh_cookie(response: Response, refresh_token: str, settings: Settings) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie("refresh_token", path="/")


@router.post("/register", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED, summary="Cadastrar empresa e primeiro usuário")
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    await enforce_rate_limit(request, bucket="auth:register", limit=20, window_seconds=60)
    service = AuthService(db, settings, request.app.state.token_store)
    session, refresh_token = await service.register_company_admin(payload, get_client_ip(request))
    set_refresh_cookie(response, refresh_token, settings)
    return session


@router.post("/login", response_model=AuthSessionResponse, summary="Autenticar usuário")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    await enforce_rate_limit(request, bucket="auth:login", limit=50, window_seconds=15 * 60)
    service = AuthService(db, settings, request.app.state.token_store)
    session, refresh_token = await service.authenticate(payload, get_client_ip(request))
    set_refresh_cookie(response, refresh_token, settings)
    return session


@router.post("/refresh", response_model=AuthSessionResponse, summary="Rotacionar refresh token")
async def refresh_session(
    payload: RefreshRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    token = payload.refresh_token or request.cookies.get("refresh_token")
    service = AuthService(db, settings, request.app.state.token_store)
    session, refresh_token = await service.refresh_session(token or "")
    set_refresh_cookie(response, refresh_token, settings)
    return session


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Encerrar sessão")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    service = AuthService(db, settings, request.app.state.token_store)
    await service.logout(request.cookies.get("refresh_token"))
    clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post("/forgot-password", response_model=ForgotPasswordResponse, summary="Solicitar reset de senha")
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ForgotPasswordResponse:
    await enforce_rate_limit(request, bucket="auth:forgot-password", limit=20, window_seconds=60)
    service = AuthService(db, settings, request.app.state.token_store)
    return await service.request_password_reset(payload.email, get_client_ip(request))


@router.post("/reset-password", response_model=dict, summary="Redefinir senha")
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    service = AuthService(db, settings, request.app.state.token_store)
    await service.reset_password(payload.token, payload.new_password, get_client_ip(request))
    return {"message": "Senha redefinida com sucesso."}


@router.get("/me", response_model=CurrentUserResponse, summary="Retornar contexto do usuário autenticado")
async def me(current_user=Depends(get_current_user)) -> CurrentUserResponse:
    return CurrentUserResponse(
        user=current_user.user,
        company=current_user.user.company,
        permissions=sorted(current_user.permissions),
    )
