from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_db, require_permission
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=list[AuditLogResponse], summary="Listar trilha de auditoria")
async def list_audit_logs(
    action: str | None = Query(default=None, max_length=120),
    table_name: str | None = Query(default=None, max_length=120),
    user_id: UUID | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    current_user: RequestUser = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
) -> list[AuditLogResponse]:
    filters = [AuditLog.company_id == current_user.company_id]
    if action:
        filters.append(AuditLog.action == action)
    if table_name:
        filters.append(AuditLog.table_name == table_name)
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    result = await db.execute(
        select(AuditLog)
        .where(*filters)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
