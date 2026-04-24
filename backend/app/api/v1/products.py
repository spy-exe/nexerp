from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse], summary="Listar produtos")
async def list_products(
    current_user: RequestUser = Depends(require_permission("products:read")),
    db: AsyncSession = Depends(get_db),
) -> list[ProductResponse]:
    service = ProductService(db)
    products = await service.list(current_user.company_id)
    return [ProductResponse.model_validate(product) for product in products]


@router.get("/{product_id}", response_model=ProductResponse, summary="Detalhar produto")
async def get_product(
    product_id: UUID,
    current_user: RequestUser = Depends(require_permission("products:read")),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    service = ProductService(db)
    product = await service.get(current_user.company_id, product_id)
    return ProductResponse.model_validate(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Criar produto")
async def create_product(
    payload: ProductCreate,
    current_user: RequestUser = Depends(require_permission("products:create")),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    service = ProductService(db)
    product = await service.create(current_user.company_id, current_user.id, payload, None)
    return ProductResponse.model_validate(product)


@router.patch("/{product_id}", response_model=ProductResponse, summary="Atualizar produto")
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    current_user: RequestUser = Depends(require_permission("products:update")),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    service = ProductService(db)
    product = await service.update(current_user.company_id, product_id, current_user.id, payload, None)
    return ProductResponse.model_validate(product)


@router.post("/{product_id}/archive", response_model=ProductResponse, summary="Arquivar produto")
async def archive_product(
    product_id: UUID,
    current_user: RequestUser = Depends(require_permission("products:update")),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    service = ProductService(db)
    product = await service.archive(current_user.company_id, product_id, current_user.id, None)
    return ProductResponse.model_validate(product)
