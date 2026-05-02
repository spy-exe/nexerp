from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_client_ip, get_db, get_current_user, require_permission
from app.schemas.company import CompanyOnboardingUpdate, CompanyResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyResponse, summary="Detalhes da empresa autenticada")
async def get_company(
    current_user: RequestUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    service = CompanyService(db)
    company = await service.get_by_id(current_user.company_id)
    return CompanyResponse.model_validate(company)


@router.patch("/me/onboarding", response_model=CompanyResponse, summary="Concluir onboarding da empresa")
async def update_onboarding(
    payload: CompanyOnboardingUpdate,
    request: Request,
    current_user: RequestUser = Depends(require_permission("company:update")),
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    service = CompanyService(db)
    company = await service.update_onboarding(
        company_id=current_user.company_id,
        user_id=current_user.id,
        payload=payload,
        ip_address=get_client_ip(request),
    )
    return CompanyResponse.model_validate(company)
