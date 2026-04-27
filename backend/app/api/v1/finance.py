from __future__ import annotations

from datetime import date
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_client_ip, get_db, require_permission
from app.models.finance import TransactionType
from app.schemas.finance import (
    CashFlowOut,
    FinancialAccountCreate,
    FinancialAccountOut,
    FinancialAccountUpdate,
    FinancialCategoryCreate,
    FinancialCategoryOut,
    FinancialCategoryUpdate,
    FinancialSummaryOut,
    InstallmentCreate,
    InstallmentOut,
    InstallmentPayment,
    InstallmentUpdate,
    TransactionCreate,
    TransactionOut,
    TransactionUpdate,
)
from app.services.finance_service import FinanceService

router = APIRouter(prefix="/finance", tags=["finance"])


# ── helpers ────────────────────────────────────────────────────────────────────

def _svc(db: AsyncSession = Depends(get_db)) -> FinanceService:
    return FinanceService(db)


def _installment_out(inst) -> InstallmentOut:
    return InstallmentOut(
        id=inst.id,
        person_id=inst.person_id,
        person_name=inst.person.name if inst.person else None,
        type=inst.type,
        description=inst.description,
        total_amount=inst.total_amount,
        paid_amount=inst.paid_amount,
        remaining_amount=inst.total_amount - inst.paid_amount,
        due_date=inst.due_date,
        status=inst.status,
        notes=inst.notes,
    )


def _txn_out(txn) -> TransactionOut:
    return TransactionOut(
        id=txn.id,
        account_id=txn.account_id,
        account_name=txn.account.name if txn.account else "",
        category_id=txn.category_id,
        category_name=txn.category.name if txn.category else None,
        person_id=txn.person_id,
        person_name=txn.person.name if txn.person else None,
        type=txn.type,
        amount=txn.amount,
        date=txn.date,
        description=txn.description,
        reconciled=txn.reconciled,
        notes=txn.notes,
    )


# ── Summary ────────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=FinancialSummaryOut, summary="Resumo financeiro")
async def get_summary(
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    return await svc.summary(current_user.company_id)


# ── Cash Flow ──────────────────────────────────────────────────────────────────

@router.get("/cashflow", response_model=CashFlowOut, summary="Fluxo de caixa")
async def get_cashflow(
    date_from: date = Query(..., description="Data início (YYYY-MM-DD)"),
    date_to: date = Query(..., description="Data fim (YYYY-MM-DD)"),
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    return await svc.cash_flow(current_user.company_id, date_from, date_to)


# ── Accounts ────────────────────────────────────────────────────────────────────

@router.get("/accounts", response_model=list[FinancialAccountOut], summary="Listar contas")
async def list_accounts(
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    return await svc.list_accounts(current_user.company_id)


@router.post(
    "/accounts",
    response_model=FinancialAccountOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta",
)
async def create_account(
    payload: FinancialAccountCreate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    return await svc.create_account(current_user.company_id, current_user.id, payload, ip)


@router.get("/accounts/{account_id}", response_model=FinancialAccountOut, summary="Detalhes da conta")
async def get_account(
    account_id: UUID,
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    return await svc.get_account(current_user.company_id, account_id)


@router.patch("/accounts/{account_id}", response_model=FinancialAccountOut, summary="Atualizar conta")
async def update_account(
    account_id: UUID,
    payload: FinancialAccountUpdate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    return await svc.update_account(current_user.company_id, account_id, current_user.id, payload, ip)


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deletar conta")
async def delete_account(
    account_id: UUID,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    await svc.delete_account(current_user.company_id, account_id, current_user.id, ip)


# ── Categories ──────────────────────────────────────────────────────────────────

@router.get(
    "/categories",
    response_model=list[FinancialCategoryOut],
    summary="Listar categorias financeiras",
)
async def list_categories(
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    return await svc.list_categories(current_user.company_id)


@router.post(
    "/categories",
    response_model=FinancialCategoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar categoria financeira",
)
async def create_category(
    payload: FinancialCategoryCreate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    return await svc.create_category(current_user.company_id, current_user.id, payload, ip)


@router.patch(
    "/categories/{category_id}",
    response_model=FinancialCategoryOut,
    summary="Atualizar categoria financeira",
)
async def update_category(
    category_id: UUID,
    payload: FinancialCategoryUpdate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    return await svc.update_category(current_user.company_id, category_id, current_user.id, payload, ip)


# ── Transactions ────────────────────────────────────────────────────────────────

@router.get("/transactions", response_model=list[TransactionOut], summary="Listar transações")
async def list_transactions(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    account_id: UUID | None = Query(None),
    type_filter: str | None = Query(None, alias="type"),
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    txns = await svc.list_transactions(
        current_user.company_id, date_from, date_to, account_id, type_filter
    )
    return [_txn_out(t) for t in txns]


@router.post(
    "/transactions",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar transação",
)
async def create_transaction(
    payload: TransactionCreate,
    current_user: RequestUser = Depends(require_permission("finance:transactions")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    txn = await svc.create_transaction(current_user.company_id, current_user.id, payload, ip)
    return _txn_out(txn)


@router.get("/transactions/{transaction_id}", response_model=TransactionOut, summary="Detalhes da transação")
async def get_transaction(
    transaction_id: UUID,
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    txn = await svc.get_transaction(current_user.company_id, transaction_id)
    return _txn_out(txn)


@router.patch(
    "/transactions/{transaction_id}",
    response_model=TransactionOut,
    summary="Atualizar transação",
)
async def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    current_user: RequestUser = Depends(require_permission("finance:transactions")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    txn = await svc.update_transaction(current_user.company_id, transaction_id, current_user.id, payload, ip)
    return _txn_out(txn)


@router.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar transação",
)
async def delete_transaction(
    transaction_id: UUID,
    current_user: RequestUser = Depends(require_permission("finance:transactions")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    await svc.delete_transaction(current_user.company_id, transaction_id, current_user.id, ip)


# ── Installments ────────────────────────────────────────────────────────────────

@router.get("/receivables", response_model=list[InstallmentOut], summary="Contas a receber")
async def list_receivables(
    status_filter: str | None = Query(None, alias="status"),
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    insts = await svc.list_installments(
        current_user.company_id,
        type_filter=TransactionType.income.value,
        status_filter=status_filter,
    )
    return [_installment_out(i) for i in insts]


@router.get("/payables", response_model=list[InstallmentOut], summary="Contas a pagar")
async def list_payables(
    status_filter: str | None = Query(None, alias="status"),
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    insts = await svc.list_installments(
        current_user.company_id,
        type_filter=TransactionType.expense.value,
        status_filter=status_filter,
    )
    return [_installment_out(i) for i in insts]


@router.post(
    "/receivables",
    response_model=InstallmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta a receber",
)
async def create_receivable(
    payload: InstallmentCreate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    payload.type = TransactionType.income  # type: ignore[assignment]
    inst = await svc.create_installment(current_user.company_id, current_user.id, payload, ip)
    return _installment_out(inst)


@router.post(
    "/payables",
    response_model=InstallmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta a pagar",
)
async def create_payable(
    payload: InstallmentCreate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    payload.type = TransactionType.expense  # type: ignore[assignment]
    inst = await svc.create_installment(current_user.company_id, current_user.id, payload, ip)
    return _installment_out(inst)


@router.post(
    "/receivables/{installment_id}/pay",
    response_model=InstallmentOut,
    summary="Liquidar conta a receber",
)
async def pay_receivable(
    installment_id: UUID,
    payload: InstallmentPayment,
    current_user: RequestUser = Depends(require_permission("finance:pay")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    inst = await svc.pay_installment(current_user.company_id, installment_id, current_user.id, payload, ip)
    return _installment_out(inst)


@router.post(
    "/payables/{installment_id}/pay",
    response_model=InstallmentOut,
    summary="Liquidar conta a pagar",
)
async def pay_payable(
    installment_id: UUID,
    payload: InstallmentPayment,
    current_user: RequestUser = Depends(require_permission("finance:pay")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    inst = await svc.pay_installment(current_user.company_id, installment_id, current_user.id, payload, ip)
    return _installment_out(inst)


@router.patch(
    "/installments/{installment_id}",
    response_model=InstallmentOut,
    summary="Atualizar parcela",
)
async def update_installment(
    installment_id: UUID,
    payload: InstallmentUpdate,
    current_user: RequestUser = Depends(require_permission("finance:manage")),
    svc: FinanceService = Depends(_svc),
    ip: str = Depends(get_client_ip),
):
    inst = await svc.update_installment(current_user.company_id, installment_id, current_user.id, payload, ip)
    return _installment_out(inst)


# ── Reports / Exports ───────────────────────────────────────────────────────────

@router.get("/reports/transactions/excel", summary="Exportar transações (Excel)")
async def export_transactions_excel(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    try:
        import openpyxl
    except ImportError:
        return Response(
            content='{"detail": "openpyxl não instalado."}',
            status_code=500,
            media_type="application/json",
        )

    txns = await svc.list_transactions(current_user.company_id, date_from, date_to)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Transações"
    ws.append(["Data", "Tipo", "Descrição", "Conta", "Categoria", "Pessoa", "Valor", "Conciliado"])
    for t in txns:
        ws.append([
            str(t.date),
            "Receita" if t.type == "income" else "Despesa",
            t.description,
            t.account.name if t.account else "",
            t.category.name if t.category else "",
            t.person.name if t.person else "",
            float(t.amount),
            "Sim" if t.reconciled else "Não",
        ])

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transacoes.xlsx"},
    )


@router.get("/reports/transactions/pdf", summary="Exportar transações (PDF)")
async def export_transactions_pdf(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    current_user: RequestUser = Depends(require_permission("finance:read")),
    svc: FinanceService = Depends(_svc),
):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError:
        return Response(
            content='{"detail": "reportlab não instalado."}',
            status_code=500,
            media_type="application/json",
        )

    txns = await svc.list_transactions(current_user.company_id, date_from, date_to)

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), rightMargin=15 * mm, leftMargin=15 * mm)
    styles = getSampleStyleSheet()
    elements = [Paragraph("Relatório de Transações — NexERP", styles["Title"]), Spacer(1, 6 * mm)]

    header = ["Data", "Tipo", "Descrição", "Conta", "Valor (R$)"]
    rows = [header]
    for t in txns:
        rows.append([
            str(t.date),
            "Receita" if t.type == "income" else "Despesa",
            t.description[:50],
            t.account.name if t.account else "",
            f"{t.amount:.2f}",
        ])

    table = Table(rows, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94a3b8")),
        ("ALIGN", (4, 1), (4, -1), "RIGHT"),
    ]))
    elements.append(table)
    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=transacoes.pdf"},
    )
