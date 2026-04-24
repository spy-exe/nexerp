from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse], summary="Listar categorias")
async def list_categories(
    current_user: RequestUser = Depends(require_permission("categories:read")),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryResponse]:
    service = CategoryService(db)
    categories = await service.list(current_user.company_id)
    return [CategoryResponse.model_validate(category) for category in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Criar categoria")
async def create_category(
    payload: CategoryCreate,
    current_user: RequestUser = Depends(require_permission("categories:create")),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    service = CategoryService(db)
    category = await service.create(current_user.company_id, current_user.id, payload, None)
    return CategoryResponse.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryResponse, summary="Atualizar categoria")
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    current_user: RequestUser = Depends(require_permission("categories:update")),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    service = CategoryService(db)
    category = await service.update(current_user.company_id, category_id, current_user.id, payload, None)
    return CategoryResponse.model_validate(category)


@router.post("/{category_id}/archive", response_model=CategoryResponse, summary="Arquivar categoria")
async def archive_category(
    category_id: UUID,
    current_user: RequestUser = Depends(require_permission("categories:update")),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    service = CategoryService(db)
    category = await service.archive(current_user.company_id, category_id, current_user.id, None)
    return CategoryResponse.model_validate(category)
