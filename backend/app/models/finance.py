from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import (
    ActivatableMixin,
    CompanyBoundMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.party import BusinessParty


class AccountType(str, Enum):
    bank = "bank"
    cash = "cash"
    digital = "digital"


class TransactionType(str, Enum):
    income = "income"
    expense = "expense"


class InstallmentStatus(str, Enum):
    open = "open"
    partial = "partial"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"


class FinancialAccount(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    CompanyBoundMixin,
    ActivatableMixin,
):
    __tablename__ = "financial_accounts"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default=AccountType.cash.value)
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    bank_name: Mapped[str | None] = mapped_column(String(100))
    agency: Mapped[str | None] = mapped_column(String(20))
    account_number: Mapped[str | None] = mapped_column(String(30))
    notes: Mapped[str | None] = mapped_column(Text)

    company: Mapped["Company"] = relationship(back_populates="financial_accounts")
    transactions: Mapped[list["FinancialTransaction"]] = relationship(
        back_populates="account", cascade="all, delete-orphan"
    )


class FinancialCategory(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    CompanyBoundMixin,
    ActivatableMixin,
):
    __tablename__ = "financial_categories"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    parent_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("financial_categories.id"), nullable=True
    )

    company: Mapped["Company"] = relationship(back_populates="financial_categories")
    parent: Mapped["FinancialCategory | None"] = relationship(
        "FinancialCategory", remote_side="FinancialCategory.id", back_populates="children"
    )
    children: Mapped[list["FinancialCategory"]] = relationship(
        "FinancialCategory", back_populates="parent"
    )
    transactions: Mapped[list["FinancialTransaction"]] = relationship(
        back_populates="category"
    )


class FinancialTransaction(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    CompanyBoundMixin,
    ActivatableMixin,
):
    __tablename__ = "financial_transactions"

    account_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("financial_accounts.id"), nullable=False, index=True
    )
    category_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("financial_categories.id"), nullable=True, index=True
    )
    person_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("business_parties.id"), nullable=True, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    reference_id: Mapped[UUID | None] = mapped_column(Uuid, nullable=True)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reconciled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    company: Mapped["Company"] = relationship(back_populates="financial_transactions")
    account: Mapped["FinancialAccount"] = relationship(back_populates="transactions")
    category: Mapped["FinancialCategory | None"] = relationship(back_populates="transactions")
    person: Mapped["BusinessParty | None"] = relationship(back_populates="financial_transactions")


class Installment(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    CompanyBoundMixin,
    ActivatableMixin,
):
    __tablename__ = "installments"

    person_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("business_parties.id"), nullable=True, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # income=receivable, expense=payable
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=InstallmentStatus.open.value)
    reference_id: Mapped[UUID | None] = mapped_column(Uuid, nullable=True)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)

    company: Mapped["Company"] = relationship(back_populates="installments")
    person: Mapped["BusinessParty | None"] = relationship(back_populates="installments")
