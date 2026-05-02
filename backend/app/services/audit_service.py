from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def log(
        self,
        *,
        company_id: UUID | None,
        action: str,
        table_name: str,
        record_id: str,
        user_id: UUID | None = None,
        old_data: dict | None = None,
        new_data: dict | None = None,
        ip_address: str | None = None,
        note: str | None = None,
    ) -> None:
        if company_id is None:
            return

        self.db.add(
            AuditLog(
                company_id=company_id,
                user_id=user_id,
                action=action,
                table_name=table_name,
                record_id=record_id,
                old_data=old_data,
                new_data=new_data,
                ip_address=ip_address,
                note=note,
            )
        )
