from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.finance import AccountType, InstallmentStatus, TransactionType


# ── Financial Account ──────────────────────────────────────────────────────────

class FinancialAccountCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: AccountType = AccountType.cash
    balance: Decimal = Field(default=Decimal("0.00"), ge=Decimal("-999999999.99"))
    bank_name: str | None = Field(None, max_length=100)
    agency: str | None = Field(None, max_length=20)
    account_number: str | None = Field(None, max_length=30)
    notes: str | None = None


class FinancialAccountUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    type: AccountType | None = None
    bank_name: str | None = Field(None, max_length=100)
    agency: str | None = Field(None, max_length=20)
    account_number: str | None = Field(None, max_length=30)
    notes: str | None = None
    is_active: bool | None = None


class FinancialAccountOut(BaseModel):
    id: UUID
    name: str
    type: str
    balance: Decimal
    bank_name: str | None
    agency: str | None
    account_number: str | None
    notes: str | None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Financial Category ─────────────────────────────────────────────────────────

class FinancialCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: TransactionType
    parent_id: UUID | None = None


class FinancialCategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    is_active: bool | None = None


class FinancialCategoryOut(BaseModel):
    id: UUID
    name: str
    type: str
    parent_id: UUID | None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Transaction ────────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    account_id: UUID
    category_id: UUID | None = None
    person_id: UUID | None = None
    type: TransactionType
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    date: date
    description: str = Field(..., min_length=2, max_length=500)
    reference_id: UUID | None = None
    reference_type: str | None = Field(None, max_length=50)
    reconciled: bool = False
    notes: str | None = None


class TransactionUpdate(BaseModel):
    category_id: UUID | None = None
    person_id: UUID | None = None
    description: str | None = Field(None, min_length=2, max_length=500)
    reconciled: bool | None = None
    notes: str | None = None


class TransactionOut(BaseModel):
    id: UUID
    account_id: UUID
    account_name: str
    category_id: UUID | None
    category_name: str | None
    person_id: UUID | None
    person_name: str | None
    type: str
    amount: Decimal
    date: date
    description: str
    reconciled: bool
    notes: str | None

    model_config = {"from_attributes": True}


# ── Installment ────────────────────────────────────────────────────────────────

class InstallmentCreate(BaseModel):
    person_id: UUID | None = None
    type: TransactionType
    description: str = Field(..., min_length=2, max_length=500)
    total_amount: Decimal = Field(..., gt=Decimal("0.00"))
    due_date: date
    reference_id: UUID | None = None
    reference_type: str | None = Field(None, max_length=50)
    notes: str | None = None


class InstallmentPayment(BaseModel):
    account_id: UUID
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    date: date
    notes: str | None = None


class InstallmentUpdate(BaseModel):
    description: str | None = Field(None, min_length=2, max_length=500)
    total_amount: Decimal | None = Field(None, gt=Decimal("0.00"))
    due_date: date | None = None
    notes: str | None = None
    status: InstallmentStatus | None = None


class InstallmentOut(BaseModel):
    id: UUID
    person_id: UUID | None
    person_name: str | None
    type: str
    description: str
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    due_date: date
    status: str
    notes: str | None

    model_config = {"from_attributes": True}


# ── Cash Flow ──────────────────────────────────────────────────────────────────

class CashFlowEntry(BaseModel):
    date: date
    income: Decimal
    expense: Decimal
    balance: Decimal


class CashFlowOut(BaseModel):
    entries: list[CashFlowEntry]
    total_income: Decimal
    total_expense: Decimal
    net: Decimal


# ── Financial Summary ──────────────────────────────────────────────────────────

class FinancialSummaryOut(BaseModel):
    total_accounts_balance: Decimal
    receivables_open: Decimal
    payables_open: Decimal
    overdue_receivables: Decimal
    overdue_payables: Decimal
    income_month: Decimal
    expense_month: Decimal
    net_month: Decimal
