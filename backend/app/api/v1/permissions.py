from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_client_ip, get_db, require_permission
from app.schemas.permissions import PermissionDefinition, RolePermissionResponse, RolePermissionUpdate
from app.services.permission_service import PermissionService

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionDefinition], summary="Listar permissões disponíveis")
async def list_permissions(
    current_user: RequestUser = Depends(require_permission("permissions:read")),
    db: AsyncSession = Depends(get_db),
) -> list[PermissionDefinition]:
    return PermissionService(db).list_permissions()


@router.get("/roles", response_model=list[RolePermissionResponse], summary="Listar permissões por papel")
async def list_role_permissions(
    current_user: RequestUser = Depends(require_permission("permissions:read")),
    db: AsyncSession = Depends(get_db),
) -> list[RolePermissionResponse]:
    service = PermissionService(db)
    return await service.list_roles(current_user.company_id)


@router.patch(
    "/roles/{role_id}",
    response_model=RolePermissionResponse,
    summary="Atualizar permissões de um papel",
)
async def update_role_permissions(
    role_id: UUID,
    payload: RolePermissionUpdate,
    request: Request,
    current_user: RequestUser = Depends(require_permission("permissions:update")),
    db: AsyncSession = Depends(get_db),
) -> RolePermissionResponse:
    service = PermissionService(db)
    return await service.update_role_permissions(
        company_id=current_user.company_id,
        role_id=role_id,
        permissions=payload.permissions,
        user_id=current_user.id,
        ip_address=get_client_ip(request),
    )
