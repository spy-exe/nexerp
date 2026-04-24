from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.models.party import PartyKind
from app.schemas.party import BusinessPartyCreate, BusinessPartyResponse, BusinessPartyUpdate
from app.services.party_service import PartyService

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[BusinessPartyResponse], summary="Listar fornecedores")
async def list_suppliers(
    current_user: RequestUser = Depends(require_permission("suppliers:read")),
    db: AsyncSession = Depends(get_db),
) -> list[BusinessPartyResponse]:
    service = PartyService(db)
    suppliers = await service.list(current_user.company_id, PartyKind.SUPPLIER)
    return [BusinessPartyResponse.model_validate(supplier) for supplier in suppliers]


@router.get("/{supplier_id}", response_model=BusinessPartyResponse, summary="Detalhar fornecedor")
async def get_supplier(
    supplier_id: UUID,
    current_user: RequestUser = Depends(require_permission("suppliers:read")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    supplier = await service.get(current_user.company_id, PartyKind.SUPPLIER, supplier_id)
    return BusinessPartyResponse.model_validate(supplier)


@router.post("", response_model=BusinessPartyResponse, status_code=status.HTTP_201_CREATED, summary="Criar fornecedor")
async def create_supplier(
    payload: BusinessPartyCreate,
    current_user: RequestUser = Depends(require_permission("suppliers:create")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    supplier = await service.create(current_user.company_id, current_user.id, PartyKind.SUPPLIER, payload, None)
    return BusinessPartyResponse.model_validate(supplier)


@router.patch("/{supplier_id}", response_model=BusinessPartyResponse, summary="Atualizar fornecedor")
async def update_supplier(
    supplier_id: UUID,
    payload: BusinessPartyUpdate,
    current_user: RequestUser = Depends(require_permission("suppliers:update")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    supplier = await service.update(current_user.company_id, supplier_id, current_user.id, PartyKind.SUPPLIER, payload, None)
    return BusinessPartyResponse.model_validate(supplier)


@router.post("/{supplier_id}/archive", response_model=BusinessPartyResponse, summary="Arquivar fornecedor")
async def archive_supplier(
    supplier_id: UUID,
    current_user: RequestUser = Depends(require_permission("suppliers:update")),
    db: AsyncSession = Depends(get_db),
) -> BusinessPartyResponse:
    service = PartyService(db)
    supplier = await service.archive(current_user.company_id, supplier_id, current_user.id, PartyKind.SUPPLIER, None)
    return BusinessPartyResponse.model_validate(supplier)
