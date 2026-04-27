from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.models.party import PartyKind
from app.schemas.party import BusinessPartyCreate, BusinessPartyResponse, BusinessPartyUpdate
from app.services.party_service import PartyService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[BusinessPartyResponse], summary="Listar clientes")
async def list_customers(
    current_user: RequestUser = Depends(require_permission("customers:read")),
    db: AsyncSession = Depends(get_db),
) -> list[BusinessPartyResponse]:
    service = PartyService(db)
    customers = await service.list(current_user.company_id, PartyKind.CUSTOMER)
    return [BusinessPartyResponse.model_validate(customer) for customer in customers]


@router.get("/{customer_id}", response_model=BusinessPartyResponse, summary="Detalhar cliente")
async def get_customer(
    customer_id: UUID,
    current_user: RequestUser = Depends(require_permission("customers:read")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    customer = await service.get(current_user.company_id, PartyKind.CUSTOMER, customer_id)
    return BusinessPartyResponse.model_validate(customer)


@router.post("", response_model=BusinessPartyResponse, status_code=status.HTTP_201_CREATED, summary="Criar cliente")
async def create_customer(
    payload: BusinessPartyCreate,
    current_user: RequestUser = Depends(require_permission("customers:create")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    customer = await service.create(current_user.company_id, current_user.id, PartyKind.CUSTOMER, payload, None)
    return BusinessPartyResponse.model_validate(customer)


@router.patch("/{customer_id}", response_model=BusinessPartyResponse, summary="Atualizar cliente")
async def update_customer(
    customer_id: UUID,
    payload: BusinessPartyUpdate,
    current_user: RequestUser = Depends(require_permission("customers:update")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    customer = await service.update(current_user.company_id, customer_id, current_user.id, PartyKind.CUSTOMER, payload, None)
    return BusinessPartyResponse.model_validate(customer)


@router.post("/{customer_id}/archive", response_model=BusinessPartyResponse, summary="Arquivar cliente")
async def archive_customer(
    customer_id: UUID,
    current_user: RequestUser = Depends(require_permission("customers:update")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    customer = await service.archive(current_user.company_id, customer_id, current_user.id, PartyKind.CUSTOMER, None)
    return BusinessPartyResponse.model_validate(customer)
