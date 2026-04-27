from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.party import BusinessParty, PartyKind, PartyPersonKind
from app.schemas.party import BusinessPartyCreate, BusinessPartyUpdate
from app.services.audit_service import AuditService
from app.utils.br_documents import validate_cep, validate_cnpj, validate_cpf


class PartyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def list(self, company_id: UUID, kind: PartyKind) -> list[BusinessParty]:
        result = await self.db.execute(
            select(BusinessParty)
            .where(
                BusinessParty.company_id == company_id,
                BusinessParty.kind == kind.value,
                BusinessParty.deleted_at.is_(None),
            )
            .order_by(BusinessParty.name.asc())
        )
        return list(result.scalars().all())

    async def get(self, company_id: UUID, kind: PartyKind, party_id: UUID) -> BusinessParty:
        result = await self.db.execute(
            select(BusinessParty).where(
                BusinessParty.id == party_id,
                BusinessParty.company_id == company_id,
                BusinessParty.kind == kind.value,
                BusinessParty.deleted_at.is_(None),
            )
        )
        party = result.scalar_one_or_none()
        if party is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cadastro não encontrado.")
        return party

    async def create(
        self,
        company_id: UUID,
        user_id: UUID,
        kind: PartyKind,
        payload: BusinessPartyCreate,
        ip_address: str | None,
    ) -> BusinessParty:
        normalized = await self._normalize_payload(company_id, kind, payload.model_dump())
        party = BusinessParty(company_id=company_id, kind=kind.value, **normalized)
        self.db.add(party)
        await self.db.flush()
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action=f"{kind.value}s.created",
            table_name="business_parties",
            record_id=str(party.id),
            new_data={**payload.model_dump(mode="json"), "document_number": party.document_number},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(party)
        return party

    async def update(
        self,
        company_id: UUID,
        party_id: UUID,
        user_id: UUID,
        kind: PartyKind,
        payload: BusinessPartyUpdate,
        ip_address: str | None,
    ) -> BusinessParty:
        party = await self.get(company_id, kind, party_id)
        previous = {
            "person_kind": party.person_kind,
            "name": party.name,
            "email": party.email,
            "phone": party.phone,
            "document_number": party.document_number,
            "state_registration": party.state_registration,
            "municipal_registration": party.municipal_registration,
            "address_zip": party.address_zip,
            "address_state": party.address_state,
            "address_city": party.address_city,
            "address_street": party.address_street,
            "address_number": party.address_number,
            "address_neighborhood": party.address_neighborhood,
            "notes": party.notes,
            "is_active": party.is_active,
        }
        update_data = payload.model_dump(exclude_unset=True)
        if update_data:
            normalized = await self._normalize_payload(
                company_id,
                kind,
                {
                    **previous,
                    **update_data,
                },
                exclude_id=party_id,
            )
            for field, value in normalized.items():
                setattr(party, field, value)
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action=f"{kind.value}s.updated",
            table_name="business_parties",
            record_id=str(party.id),
            old_data=previous,
            new_data=payload.model_dump(exclude_unset=True, mode="json"),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(party)
        return party

    async def archive(
        self,
        company_id: UUID,
        party_id: UUID,
        user_id: UUID,
        kind: PartyKind,
        ip_address: str | None,
    ) -> BusinessParty:
        party = await self.get(company_id, kind, party_id)
        party.is_active = False
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action=f"{kind.value}s.archived",
            table_name="business_parties",
            record_id=str(party.id),
            old_data={"is_active": True},
            new_data={"is_active": False},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(party)
        return party

    async def _normalize_payload(
        self,
        company_id: UUID,
        kind: PartyKind,
        payload: dict,
        exclude_id: UUID | None = None,
    ) -> dict:
        normalized = {key: value for key, value in payload.items()}
        person_kind = normalized["person_kind"]
        if person_kind == PartyPersonKind.COMPANY.value:
            normalized["document_number"] = validate_cnpj(normalized["document_number"])
        elif person_kind == PartyPersonKind.INDIVIDUAL.value:
            normalized["document_number"] = validate_cpf(normalized["document_number"])
        else:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Tipo de pessoa inválido.")

        if normalized.get("address_zip"):
            normalized["address_zip"] = validate_cep(normalized["address_zip"])
        if normalized.get("address_state"):
            normalized["address_state"] = str(normalized["address_state"]).upper()

        await self._ensure_unique_document(company_id, kind, normalized["document_number"], exclude_id)
        return normalized

    async def _ensure_unique_document(
        self,
        company_id: UUID,
        kind: PartyKind,
        document_number: str,
        exclude_id: UUID | None,
    ) -> None:
        result = await self.db.execute(
            select(BusinessParty.id).where(
                BusinessParty.company_id == company_id,
                BusinessParty.kind == kind.value,
                BusinessParty.document_number == document_number,
                BusinessParty.deleted_at.is_(None),
            )
        )
        existing_id = result.scalar_one_or_none()
        if existing_id is not None and existing_id != exclude_id:
            label = "Cliente" if kind == PartyKind.CUSTOMER else "Fornecedor"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{label} já cadastrado para este documento.",
            )
