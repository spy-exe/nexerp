from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import ActivatableMixin, CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company


class PartyKind(str, Enum):
    CUSTOMER = "customer"
    SUPPLIER = "supplier"


class PartyPersonKind(str, Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"


class BusinessParty(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin, ActivatableMixin):
    __tablename__ = "business_parties"
    __table_args__ = (
        UniqueConstraint("company_id", "kind", "document_number", name="uq_business_parties_scope_document"),
    )

    kind: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    person_kind: Mapped[str] = mapped_column(String(20), nullable=False, default=PartyPersonKind.COMPANY.value)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    document_number: Mapped[str] = mapped_column(String(14), nullable=False)
    state_registration: Mapped[str | None] = mapped_column(String(30))
    municipal_registration: Mapped[str | None] = mapped_column(String(30))
    address_zip: Mapped[str | None] = mapped_column(String(8))
    address_state: Mapped[str | None] = mapped_column(String(2))
    address_city: Mapped[str | None] = mapped_column(String(120))
    address_street: Mapped[str | None] = mapped_column(String(255))
    address_number: Mapped[str | None] = mapped_column(String(30))
    address_neighborhood: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(String(500))

    company: Mapped["Company"] = relationship(back_populates="business_parties")
