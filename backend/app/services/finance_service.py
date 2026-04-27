from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.finance import (
    FinancialAccount,
    FinancialCategory,
    FinancialTransaction,
    Installment,
    InstallmentStatus,
    TransactionType,
)
from app.models.party import BusinessParty
from app.schemas.finance import (
    FinancialAccountCreate,
    FinancialAccountUpdate,
    FinancialCategoryCreate,
    FinancialCategoryUpdate,
    InstallmentCreate,
    InstallmentPayment,
    InstallmentUpdate,
    TransactionCreate,
    TransactionUpdate,
)
from app.services.audit_service import AuditService

MONEY = Decimal("0.01")


def _money(v: Decimal) -> Decimal:
    return v.quantize(MONEY)


def _json_safe(data: dict | None) -> dict | None:
    """Convert dict values to JSON-serializable primitives (Decimal → str, UUID → str)."""
    if data is None:
        return None
    import json
    from decimal import Decimal
    from uuid import UUID as _UUID

    def _default(obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, _UUID):
            return str(obj)
        if isinstance(obj, date):
            return obj.isoformat()
        raise TypeError(f"{type(obj)} not serializable")

    return json.loads(json.dumps(data, default=_default))


def _audit(svc: AuditService, *, company_id: UUID, user_id: UUID, action: str,
           table_name: str, record_id: UUID, ip: str | None,
           old_data: dict | None = None, new_data: dict | None = None) -> None:
    svc.log(
        company_id=company_id,
        user_id=user_id,
        action=action,
        table_name=table_name,
        record_id=str(record_id),
        old_data=_json_safe(old_data),
        new_data=_json_safe(new_data),
        ip_address=ip,
    )


class FinanceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    # ── Accounts ────────────────────────────────────────────────────────────────

    async def list_accounts(self, company_id: UUID) -> list[FinancialAccount]:
        result = await self.db.execute(
            select(FinancialAccount)
            .where(FinancialAccount.company_id == company_id, FinancialAccount.deleted_at.is_(None))
            .order_by(FinancialAccount.name)
        )
        return list(result.scalars().all())

    async def get_account(self, company_id: UUID, account_id: UUID) -> FinancialAccount:
        result = await self.db.execute(
            select(FinancialAccount).where(
                FinancialAccount.company_id == company_id,
                FinancialAccount.id == account_id,
                FinancialAccount.deleted_at.is_(None),
            )
        )
        account = result.scalar_one_or_none()
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada.")
        return account

    async def create_account(
        self, company_id: UUID, user_id: UUID, payload: FinancialAccountCreate, ip: str | None
    ) -> FinancialAccount:
        account = FinancialAccount(
            company_id=company_id,
            name=payload.name,
            type=payload.type.value,
            balance=_money(payload.balance),
            bank_name=payload.bank_name,
            agency=payload.agency,
            account_number=payload.account_number,
            notes=payload.notes,
        )
        self.db.add(account)
        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="create", table_name="financial_accounts",
               record_id=account.id, new_data=payload.model_dump(), ip=ip)
        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def update_account(
        self, company_id: UUID, account_id: UUID, user_id: UUID,
        payload: FinancialAccountUpdate, ip: str | None
    ) -> FinancialAccount:
        account = await self.get_account(company_id, account_id)
        old_data = {c.name: str(getattr(account, c.name)) for c in account.__table__.columns}
        for field, value in payload.model_dump(exclude_none=True).items():
            if hasattr(value, "value"):
                value = value.value
            setattr(account, field, value)
        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="update", table_name="financial_accounts",
               record_id=account_id, old_data=old_data,
               new_data=payload.model_dump(exclude_none=True), ip=ip)
        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def delete_account(
        self, company_id: UUID, account_id: UUID, user_id: UUID, ip: str | None
    ) -> None:
        account = await self.get_account(company_id, account_id)
        account.deleted_at = datetime.now(UTC)
        account.is_active = False
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="delete", table_name="financial_accounts",
               record_id=account_id, ip=ip)
        await self.db.commit()

    # ── Categories ──────────────────────────────────────────────────────────────

    async def list_categories(self, company_id: UUID) -> list[FinancialCategory]:
        result = await self.db.execute(
            select(FinancialCategory)
            .where(FinancialCategory.company_id == company_id, FinancialCategory.deleted_at.is_(None))
            .order_by(FinancialCategory.name)
        )
        return list(result.scalars().all())

    async def get_category(self, company_id: UUID, category_id: UUID) -> FinancialCategory:
        result = await self.db.execute(
            select(FinancialCategory).where(
                FinancialCategory.company_id == company_id,
                FinancialCategory.id == category_id,
                FinancialCategory.deleted_at.is_(None),
            )
        )
        cat = result.scalar_one_or_none()
        if cat is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
        return cat

    async def create_category(
        self, company_id: UUID, user_id: UUID, payload: FinancialCategoryCreate, ip: str | None
    ) -> FinancialCategory:
        if payload.parent_id:
            await self.get_category(company_id, payload.parent_id)
        cat = FinancialCategory(
            company_id=company_id,
            name=payload.name,
            type=payload.type.value,
            parent_id=payload.parent_id,
        )
        self.db.add(cat)
        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="create", table_name="financial_categories",
               record_id=cat.id, new_data=payload.model_dump(), ip=ip)
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    async def update_category(
        self, company_id: UUID, category_id: UUID, user_id: UUID,
        payload: FinancialCategoryUpdate, ip: str | None
    ) -> FinancialCategory:
        cat = await self.get_category(company_id, category_id)
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(cat, field, value)
        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="update", table_name="financial_categories",
               record_id=category_id, new_data=payload.model_dump(exclude_none=True), ip=ip)
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    # ── Transactions ────────────────────────────────────────────────────────────

    async def list_transactions(
        self,
        company_id: UUID,
        date_from: date | None = None,
        date_to: date | None = None,
        account_id: UUID | None = None,
        type_filter: str | None = None,
    ) -> list[FinancialTransaction]:
        filters = [FinancialTransaction.company_id == company_id]
        if date_from:
            filters.append(FinancialTransaction.date >= date_from)
        if date_to:
            filters.append(FinancialTransaction.date <= date_to)
        if account_id:
            filters.append(FinancialTransaction.account_id == account_id)
        if type_filter:
            filters.append(FinancialTransaction.type == type_filter)

        result = await self.db.execute(
            select(FinancialTransaction)
            .options(
                joinedload(FinancialTransaction.account),
                joinedload(FinancialTransaction.category),
                joinedload(FinancialTransaction.person),
            )
            .where(and_(*filters), FinancialTransaction.deleted_at.is_(None))
            .order_by(FinancialTransaction.date.desc(), FinancialTransaction.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get_transaction(self, company_id: UUID, transaction_id: UUID) -> FinancialTransaction:
        result = await self.db.execute(
            select(FinancialTransaction)
            .options(
                joinedload(FinancialTransaction.account),
                joinedload(FinancialTransaction.category),
                joinedload(FinancialTransaction.person),
            )
            .where(
                FinancialTransaction.company_id == company_id,
                FinancialTransaction.id == transaction_id,
                FinancialTransaction.deleted_at.is_(None),
            )
        )
        txn = result.scalar_one_or_none()
        if txn is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada.")
        return txn

    async def create_transaction(
        self, company_id: UUID, user_id: UUID, payload: TransactionCreate, ip: str | None
    ) -> FinancialTransaction:
        account = await self.get_account(company_id, payload.account_id)
        if payload.category_id is not None:
            await self._get_category_for_type(company_id, payload.category_id, payload.type.value)
        if payload.person_id is not None:
            await self._get_party(company_id, payload.person_id)

        txn = FinancialTransaction(
            company_id=company_id,
            account_id=payload.account_id,
            category_id=payload.category_id,
            person_id=payload.person_id,
            type=payload.type.value,
            amount=_money(payload.amount),
            date=payload.date,
            description=payload.description,
            reference_id=payload.reference_id,
            reference_type=payload.reference_type,
            reconciled=payload.reconciled,
            notes=payload.notes,
        )
        self.db.add(txn)

        if payload.type == TransactionType.income:
            account.balance = _money(account.balance + payload.amount)
        else:
            account.balance = _money(account.balance - payload.amount)

        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="create", table_name="financial_transactions",
               record_id=txn.id, new_data=payload.model_dump(), ip=ip)
        await self.db.commit()
        return await self.get_transaction(company_id, txn.id)

    async def update_transaction(
        self, company_id: UUID, transaction_id: UUID, user_id: UUID,
        payload: TransactionUpdate, ip: str | None
    ) -> FinancialTransaction:
        txn = await self.get_transaction(company_id, transaction_id)
        data = payload.model_dump(exclude_none=True)
        if data.get("category_id") is not None:
            await self._get_category_for_type(company_id, data["category_id"], txn.type)
        if data.get("person_id") is not None:
            await self._get_party(company_id, data["person_id"])
        for field, value in data.items():
            setattr(txn, field, value)
        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="update", table_name="financial_transactions",
               record_id=transaction_id, new_data=payload.model_dump(exclude_none=True), ip=ip)
        await self.db.commit()
        return await self.get_transaction(company_id, transaction_id)

    async def delete_transaction(
        self, company_id: UUID, transaction_id: UUID, user_id: UUID, ip: str | None
    ) -> None:
        txn = await self.get_transaction(company_id, transaction_id)
        account = await self.get_account(company_id, txn.account_id)

        if txn.type == TransactionType.income.value:
            account.balance = _money(account.balance - txn.amount)
        else:
            account.balance = _money(account.balance + txn.amount)

        txn.deleted_at = datetime.now(UTC)
        txn.is_active = False
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="delete", table_name="financial_transactions",
               record_id=transaction_id, ip=ip)
        await self.db.commit()

    # ── Installments ────────────────────────────────────────────────────────────

    async def list_installments(
        self,
        company_id: UUID,
        type_filter: str | None = None,
        status_filter: str | None = None,
    ) -> list[Installment]:
        filters = [Installment.company_id == company_id]
        if type_filter:
            filters.append(Installment.type == type_filter)
        if status_filter:
            filters.append(Installment.status == status_filter)

        result = await self.db.execute(
            select(Installment)
            .options(joinedload(Installment.person))
            .where(and_(*filters), Installment.deleted_at.is_(None))
            .order_by(Installment.due_date.asc())
        )
        return list(result.scalars().unique().all())

    async def get_installment(self, company_id: UUID, installment_id: UUID) -> Installment:
        result = await self.db.execute(
            select(Installment)
            .options(joinedload(Installment.person))
            .where(Installment.company_id == company_id, Installment.id == installment_id)
            .where(Installment.deleted_at.is_(None))
        )
        inst = result.scalar_one_or_none()
        if inst is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcela não encontrada.")
        return inst

    async def create_installment(
        self, company_id: UUID, user_id: UUID, payload: InstallmentCreate, ip: str | None
    ) -> Installment:
        if payload.person_id is not None:
            await self._get_party(company_id, payload.person_id)
        inst = Installment(
            company_id=company_id,
            person_id=payload.person_id,
            type=payload.type.value,
            description=payload.description,
            total_amount=_money(payload.total_amount),
            paid_amount=Decimal("0.00"),
            due_date=payload.due_date,
            status=InstallmentStatus.open.value,
            reference_id=payload.reference_id,
            reference_type=payload.reference_type,
            notes=payload.notes,
        )
        self.db.add(inst)
        await self.db.flush()
        _audit(self.audit, company_id=company_id, user_id=user_id,
               action="create", table_name="installments",
               record_id=inst.id, new_data=payload.model_dump(), ip=ip)
        await self.db.commit()
        return await self.get_installment(company_id, inst.id)

    async def pay_installment(
        self, company_id: UUID, installment_id: UUID, user_id: UUID,
        payload: InstallmentPayment, ip: str | None
    ) -> Installment:
        inst = await self.get_installment(company_id, installment_id)
        if inst.status in (InstallmentStatus.paid.value, InstallmentStatus.cancelled.value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Esta parcela já foi liquidada ou cancelada.",
            )
        remaining = _money(inst.total_amount - inst.paid_amount)
        if _money(payload.amount) > remaining:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Valor excede o saldo devedor de {remaining}.",
            )

        txn_type = TransactionType.income if inst.type == TransactionType.income.value else TransactionType.expense
        txn_payload = TransactionCreate(
            account_id=payload.account_id,
            type=txn_type,
            amount=payload.amount,
            date=payload.date,
            description=f"Pagamento: {inst.description}",
            reference_id=installment_id,
            reference_type="installment",
            notes=payload.notes,
        )
        await self.create_transaction(company_id, user_id, txn_payload, ip)

        inst = await self.get_installment(company_id, installment_id)
        inst.paid_amount = _money(inst.paid_amount + payload.amount)
        if inst.paid_amount >= inst.total_amount:
            inst.status = InstallmentStatus.paid.value
        else:
            inst.status = InstallmentStatus.partial.value

        await self.db.commit()
        return await self.get_installment(company_id, installment_id)

    async def update_installment(
        self, company_id: UUID, installment_id: UUID, user_id: UUID,
        payload: InstallmentUpdate, ip: str | None
    ) -> Installment:
        inst = await self.get_installment(company_id, installment_id)
        data = payload.model_dump(exclude_none=True)
        for field, value in data.items():
            setattr(inst, field, value.value if hasattr(value, "value") else value)
        await self.db.commit()
        return await self.get_installment(company_id, installment_id)

    # ── Cash Flow ────────────────────────────────────────────────────────────────

    async def cash_flow(self, company_id: UUID, date_from: date, date_to: date) -> dict:
        result = await self.db.execute(
            select(
                FinancialTransaction.date,
                FinancialTransaction.type,
                func.sum(FinancialTransaction.amount).label("total"),
            )
            .where(
                FinancialTransaction.company_id == company_id,
                FinancialTransaction.deleted_at.is_(None),
                FinancialTransaction.date >= date_from,
                FinancialTransaction.date <= date_to,
            )
            .group_by(FinancialTransaction.date, FinancialTransaction.type)
            .order_by(FinancialTransaction.date)
        )
        rows = result.all()

        daily: dict[date, dict[str, Decimal]] = defaultdict(
            lambda: {"income": Decimal("0"), "expense": Decimal("0")}
        )
        for row in rows:
            daily[row.date][row.type] = _money(Decimal(str(row.total)))

        entries = []
        running = Decimal("0")
        current = date_from
        while current <= date_to:
            income = daily[current]["income"]
            expense = daily[current]["expense"]
            running = _money(running + income - expense)
            entries.append({"date": current, "income": income, "expense": expense, "balance": running})
            current += timedelta(days=1)

        total_income = sum(e["income"] for e in entries)
        total_expense = sum(e["expense"] for e in entries)
        return {
            "entries": entries,
            "total_income": _money(total_income),
            "total_expense": _money(total_expense),
            "net": _money(total_income - total_expense),
        }

    # ── Summary ──────────────────────────────────────────────────────────────────

    async def summary(self, company_id: UUID) -> dict:
        today = datetime.now(UTC).date()
        month_start = today.replace(day=1)

        acc_result = await self.db.execute(
            select(func.coalesce(func.sum(FinancialAccount.balance), 0)).where(
                FinancialAccount.company_id == company_id,
                FinancialAccount.is_active.is_(True),
                FinancialAccount.deleted_at.is_(None),
            )
        )
        total_balance = _money(Decimal(str(acc_result.scalar())))

        async def _open_installments(txn_type: str, overdue_only: bool = False) -> Decimal:
            filters = [
                Installment.company_id == company_id,
                Installment.deleted_at.is_(None),
                Installment.type == txn_type,
                Installment.status.in_([InstallmentStatus.open.value, InstallmentStatus.partial.value]),
            ]
            if overdue_only:
                filters.append(Installment.due_date < today)
            res = await self.db.execute(
                select(
                    func.coalesce(func.sum(Installment.total_amount - Installment.paid_amount), 0)
                ).where(and_(*filters))
            )
            return _money(Decimal(str(res.scalar())))

        recv_open = await _open_installments(TransactionType.income.value)
        pay_open = await _open_installments(TransactionType.expense.value)
        recv_overdue = await _open_installments(TransactionType.income.value, overdue_only=True)
        pay_overdue = await _open_installments(TransactionType.expense.value, overdue_only=True)

        async def _month_total(txn_type: str) -> Decimal:
            res = await self.db.execute(
                select(func.coalesce(func.sum(FinancialTransaction.amount), 0)).where(
                    FinancialTransaction.company_id == company_id,
                    FinancialTransaction.deleted_at.is_(None),
                    FinancialTransaction.type == txn_type,
                    FinancialTransaction.date >= month_start,
                    FinancialTransaction.date <= today,
                )
            )
            return _money(Decimal(str(res.scalar())))

        income_month = await _month_total(TransactionType.income.value)
        expense_month = await _month_total(TransactionType.expense.value)

        return {
            "total_accounts_balance": total_balance,
            "receivables_open": recv_open,
            "payables_open": pay_open,
            "overdue_receivables": recv_overdue,
            "overdue_payables": pay_overdue,
            "income_month": income_month,
            "expense_month": expense_month,
            "net_month": _money(income_month - expense_month),
        }

    async def _get_category_for_type(
        self,
        company_id: UUID,
        category_id: UUID,
        transaction_type: str,
    ) -> FinancialCategory:
        category = await self.get_category(company_id, category_id)
        if category.type != transaction_type:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Categoria financeira incompatível com o tipo da transação.",
            )
        return category

    async def _get_party(self, company_id: UUID, person_id: UUID) -> BusinessParty:
        result = await self.db.execute(
            select(BusinessParty).where(
                BusinessParty.company_id == company_id,
                BusinessParty.id == person_id,
                BusinessParty.deleted_at.is_(None),
                BusinessParty.is_active.is_(True),
            )
        )
        party = result.scalar_one_or_none()
        if party is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pessoa não encontrada.")
        return party
