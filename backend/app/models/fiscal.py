from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.sale import Sale
    from app.models.user import User


class FiscalDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin):
    __tablename__ = "fiscal_documents"
    __table_args__ = (UniqueConstraint("company_id", "access_key", name="uq_fiscal_documents_company_access_key"),)

    sale_id = mapped_column(Uuid, ForeignKey("sales.id"), nullable=False, index=True)
    user_id = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(2), nullable=False, default="55")
    series: Mapped[str] = mapped_column(String(3), nullable=False, default="1")
    number: Mapped[int] = mapped_column(nullable=False)
    environment: Mapped[str] = mapped_column(String(20), nullable=False, default="homologation")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")
    access_key: Mapped[str] = mapped_column(String(44), nullable=False)
    protocol: Mapped[str | None] = mapped_column(String(30))
    sefaz_endpoint: Mapped[str | None] = mapped_column(String(255))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    authorized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    xml_content: Mapped[str] = mapped_column(Text, nullable=False)
    response_message: Mapped[str | None] = mapped_column(String(500))

    company: Mapped["Company"] = relationship(back_populates="fiscal_documents")
    sale: Mapped["Sale"] = relationship(back_populates="fiscal_documents")
    user: Mapped["User"] = relationship(back_populates="fiscal_documents")
