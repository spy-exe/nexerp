from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.schemas.permissions import PermissionDefinition
from app.services.audit_service import AuditService


PERMISSIONS: tuple[PermissionDefinition, ...] = (
    PermissionDefinition(code="company:read", module="Empresa", description="Visualizar dados da empresa"),
    PermissionDefinition(code="company:update", module="Empresa", description="Atualizar dados da empresa"),
    PermissionDefinition(code="dashboard:read", module="Dashboard", description="Visualizar indicadores"),
    PermissionDefinition(code="customers:read", module="Clientes", description="Listar clientes"),
    PermissionDefinition(code="customers:create", module="Clientes", description="Criar clientes"),
    PermissionDefinition(code="customers:update", module="Clientes", description="Editar clientes"),
    PermissionDefinition(code="suppliers:read", module="Fornecedores", description="Listar fornecedores"),
    PermissionDefinition(code="suppliers:create", module="Fornecedores", description="Criar fornecedores"),
    PermissionDefinition(code="suppliers:update", module="Fornecedores", description="Editar fornecedores"),
    PermissionDefinition(code="products:read", module="Produtos", description="Listar produtos"),
    PermissionDefinition(code="products:create", module="Produtos", description="Criar produtos"),
    PermissionDefinition(code="products:update", module="Produtos", description="Editar produtos"),
    PermissionDefinition(code="categories:read", module="Categorias", description="Listar categorias"),
    PermissionDefinition(code="categories:create", module="Categorias", description="Criar categorias"),
    PermissionDefinition(code="categories:update", module="Categorias", description="Editar categorias"),
    PermissionDefinition(code="sales:read", module="Vendas", description="Listar vendas"),
    PermissionDefinition(code="sales:create", module="Vendas", description="Criar vendas e PDV"),
    PermissionDefinition(code="sales:update", module="Vendas", description="Alterar vendas"),
    PermissionDefinition(code="purchases:read", module="Compras", description="Listar compras"),
    PermissionDefinition(code="purchases:create", module="Compras", description="Criar compras"),
    PermissionDefinition(code="purchases:update", module="Compras", description="Alterar compras"),
    PermissionDefinition(code="finance:read", module="Financeiro", description="Visualizar financeiro"),
    PermissionDefinition(code="finance:manage", module="Financeiro", description="Gerenciar contas e categorias"),
    PermissionDefinition(code="finance:transactions", module="Financeiro", description="Criar transações"),
    PermissionDefinition(code="finance:pay", module="Financeiro", description="Liquidar contas a pagar/receber"),
    PermissionDefinition(code="stock:read", module="Estoque", description="Visualizar estoque"),
    PermissionDefinition(code="stock:adjust", module="Estoque", description="Registrar movimentações"),
    PermissionDefinition(code="fiscal:read", module="Fiscal", description="Visualizar documentos fiscais"),
    PermissionDefinition(code="fiscal:issue", module="Fiscal", description="Emitir NF-e em homologação"),
    PermissionDefinition(code="reports:read", module="Relatórios", description="Visualizar relatórios avançados"),
    PermissionDefinition(code="audit:read", module="Auditoria", description="Visualizar trilha de auditoria"),
    PermissionDefinition(code="permissions:read", module="Permissões", description="Visualizar permissões"),
    PermissionDefinition(code="permissions:update", module="Permissões", description="Alterar permissões de papéis"),
)


class PermissionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    def list_permissions(self) -> list[PermissionDefinition]:
        return list(PERMISSIONS)

    async def list_roles(self, company_id: UUID) -> list[Role]:
        result = await self.db.execute(
            select(Role).where(Role.company_id == company_id).order_by(Role.name.asc())
        )
        return list(result.scalars().all())

    async def update_role_permissions(
        self,
        *,
        company_id: UUID,
        role_id: UUID,
        permissions: list[str],
        user_id: UUID,
        ip_address: str | None,
    ) -> Role:
        allowed = {permission.code for permission in PERMISSIONS}
        invalid = sorted({permission for permission in permissions if permission != "*" and permission not in allowed})
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Permissões inválidas: {', '.join(invalid)}.",
            )

        role = await self._get_role(company_id, role_id)
        if role.name == "Admin":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="As permissões do papel Admin não podem ser alteradas.",
            )

        old_permissions = sorted(role.permissions)
        role.permissions = sorted(set(permissions))
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="permissions.role.updated",
            table_name="roles",
            record_id=str(role.id),
            old_data={"permissions": old_permissions},
            new_data={"permissions": role.permissions},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def _get_role(self, company_id: UUID, role_id: UUID) -> Role:
        result = await self.db.execute(
            select(Role).where(Role.company_id == company_id, Role.id == role_id)
        )
        role = result.scalar_one_or_none()
        if role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Papel não encontrado.")
        return role
