from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_client_ip, get_db, require_permission
from app.schemas.fiscal import FiscalDocumentDetailResponse, FiscalDocumentResponse, FiscalIssueRequest
from app.services.fiscal_service import FiscalService

router = APIRouter(prefix="/fiscal", tags=["fiscal"])


@router.get("/invoices", response_model=list[FiscalDocumentResponse], summary="Listar NF-e emitidas")
async def list_invoices(
    current_user: RequestUser = Depends(require_permission("fiscal:read")),
    db: AsyncSession = Depends(get_db),
) -> list[FiscalDocumentResponse]:
    service = FiscalService(db)
    return await service.list_documents(current_user.company_id)


@router.get(
    "/invoices/{document_id}",
    response_model=FiscalDocumentDetailResponse,
    summary="Detalhar NF-e emitida",
)
async def get_invoice(
    document_id: UUID,
    current_user: RequestUser = Depends(require_permission("fiscal:read")),
    db: AsyncSession = Depends(get_db),
) -> FiscalDocumentDetailResponse:
    service = FiscalService(db)
    return await service.get_document(current_user.company_id, document_id)


@router.post(
    "/nfe/homologation/sales/{sale_id}",
    response_model=FiscalDocumentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Emitir NF-e em homologação para uma venda",
)
async def issue_homologation_nfe(
    sale_id: UUID,
    payload: FiscalIssueRequest,
    request: Request,
    current_user: RequestUser = Depends(require_permission("fiscal:issue")),
    db: AsyncSession = Depends(get_db),
) -> FiscalDocumentDetailResponse:
    service = FiscalService(db)
    _ = payload.environment
    return await service.issue_homologation_nfe(
        company_id=current_user.company_id,
        user_id=current_user.id,
        sale_id=sale_id,
        ip_address=get_client_ip(request),
    )
