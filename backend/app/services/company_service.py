from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.schemas.company import CompanyOnboardingUpdate
from app.services.audit_service import AuditService


class CompanyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get_by_id(self, company_id: UUID) -> Company:
        result = await self.db.execute(select(Company).where(Company.id == company_id, Company.deleted_at.is_(None)))
        company = result.scalar_one_or_none()
        if company is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")
        return company

    async def update_onboarding(
        self,
        *,
        company_id: UUID,
        user_id: UUID,
        payload: CompanyOnboardingUpdate,
        ip_address: str | None,
    ) -> Company:
        company = await self.get_by_id(company_id)
        previous = {
            "phone": company.phone,
            "address_zip": company.address_zip,
            "tax_regime": company.tax_regime,
            "cnae": company.cnae,
            "timezone": company.timezone,
            "currency": company.currency,
        }
        data = payload.model_dump(exclude_unset=True)
        for field in ("timezone", "currency"):
            if data.get(field) is None:
                data.pop(field, None)
        for field, value in data.items():
            setattr(company, field, value)
        company.onboarding_completed = True
        self.audit.log(
            company_id=company.id,
            user_id=user_id,
            action="company.onboarding.updated",
            table_name="companies",
            record_id=str(company.id),
            old_data=previous,
            new_data=data,
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(company)
        return company
