from __future__ import annotations

from datetime import date, timedelta

import pytest

from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_financial_full_flow(client) -> None:
    session = await bootstrap_session(client)
    headers = session["headers"]

    # ── Contas bancárias ────────────────────────────────────────────────────────
    acc_resp = await client.post(
        "/api/v1/finance/accounts",
        json={"name": "Caixa Geral", "type": "cash", "balance": "1000.00"},
        headers=headers,
    )
    assert acc_resp.status_code == 201, acc_resp.text
    account = acc_resp.json()
    assert account["balance"] == "1000.00"

    bank_resp = await client.post(
        "/api/v1/finance/accounts",
        json={"name": "Conta Corrente BB", "type": "bank", "balance": "5000.00", "bank_name": "Banco do Brasil"},
        headers=headers,
    )
    assert bank_resp.status_code == 201
    bank_account = bank_resp.json()

    list_resp = await client.get("/api/v1/finance/accounts", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 2

    # ── Categorias financeiras ──────────────────────────────────────────────────
    cat_resp = await client.post(
        "/api/v1/finance/categories",
        json={"name": "Vendas", "type": "income"},
        headers=headers,
    )
    assert cat_resp.status_code == 201, cat_resp.text
    category = cat_resp.json()
    assert category["type"] == "income"

    expense_cat_resp = await client.post(
        "/api/v1/finance/categories",
        json={"name": "Fornecedores", "type": "expense"},
        headers=headers,
    )
    assert expense_cat_resp.status_code == 201
    expense_cat = expense_cat_resp.json()

    # ── Transações ──────────────────────────────────────────────────────────────
    today = date.today().isoformat()
    txn_resp = await client.post(
        "/api/v1/finance/transactions",
        json={
            "account_id": account["id"],
            "category_id": category["id"],
            "type": "income",
            "amount": "500.00",
            "date": today,
            "description": "Recebimento de venda",
        },
        headers=headers,
    )
    assert txn_resp.status_code == 201, txn_resp.text
    txn = txn_resp.json()
    assert txn["amount"] == "500.00"
    assert txn["account_name"] == "Caixa Geral"
    assert txn["category_name"] == "Vendas"

    # Saldo da conta deve ter aumentado
    acc_detail = await client.get(f"/api/v1/finance/accounts/{account['id']}", headers=headers)
    assert acc_detail.json()["balance"] == "1500.00"

    # Transação de despesa
    exp_resp = await client.post(
        "/api/v1/finance/transactions",
        json={
            "account_id": account["id"],
            "category_id": expense_cat["id"],
            "type": "expense",
            "amount": "200.00",
            "date": today,
            "description": "Pagamento fornecedor",
        },
        headers=headers,
    )
    assert exp_resp.status_code == 201
    # Saldo agora: 1500 - 200 = 1300
    acc_detail2 = await client.get(f"/api/v1/finance/accounts/{account['id']}", headers=headers)
    assert acc_detail2.json()["balance"] == "1300.00"

    # Listar transações
    list_txn = await client.get("/api/v1/finance/transactions", headers=headers)
    assert list_txn.status_code == 200
    assert len(list_txn.json()) == 2

    # ── Contas a receber ────────────────────────────────────────────────────────
    future = (date.today() + timedelta(days=30)).isoformat()
    recv_resp = await client.post(
        "/api/v1/finance/receivables",
        json={
            "description": "Fatura cliente ABC",
            "total_amount": "800.00",
            "due_date": future,
            "type": "income",
        },
        headers=headers,
    )
    assert recv_resp.status_code == 201, recv_resp.text
    recv = recv_resp.json()
    assert recv["status"] == "open"
    assert recv["remaining_amount"] == "800.00"

    # Liquidar parcialmente
    pay_resp = await client.post(
        f"/api/v1/finance/receivables/{recv['id']}/pay",
        json={
            "account_id": account["id"],
            "amount": "300.00",
            "date": today,
        },
        headers=headers,
    )
    assert pay_resp.status_code == 200, pay_resp.text
    paid = pay_resp.json()
    assert paid["status"] == "partial"
    assert paid["paid_amount"] == "300.00"
    assert paid["remaining_amount"] == "500.00"

    # Conta a receber list
    recv_list = await client.get("/api/v1/finance/receivables", headers=headers)
    assert recv_list.status_code == 200
    assert len(recv_list.json()) == 1

    # ── Contas a pagar ──────────────────────────────────────────────────────────
    pay_inst_resp = await client.post(
        "/api/v1/finance/payables",
        json={
            "description": "Aluguel escritório",
            "total_amount": "1200.00",
            "due_date": future,
            "type": "expense",
        },
        headers=headers,
    )
    assert pay_inst_resp.status_code == 201
    pay_inst = pay_inst_resp.json()
    assert pay_inst["status"] == "open"

    # Liquidar total
    pay_full_resp = await client.post(
        f"/api/v1/finance/payables/{pay_inst['id']}/pay",
        json={
            "account_id": bank_account["id"],
            "amount": "1200.00",
            "date": today,
        },
        headers=headers,
    )
    assert pay_full_resp.status_code == 200
    assert pay_full_resp.json()["status"] == "paid"

    # ── Fluxo de caixa ──────────────────────────────────────────────────────────
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    cf_resp = await client.get(
        f"/api/v1/finance/cashflow?date_from={yesterday}&date_to={tomorrow}",
        headers=headers,
    )
    assert cf_resp.status_code == 200, cf_resp.text
    cf = cf_resp.json()
    assert "entries" in cf
    assert cf["total_income"] == "800.00"   # 500 txn + 300 pay receivable
    assert cf["total_expense"] == "1400.00"  # 200 txn + 1200 pay payable

    # ── Resumo financeiro ───────────────────────────────────────────────────────
    summary_resp = await client.get("/api/v1/finance/summary", headers=headers)
    assert summary_resp.status_code == 200, summary_resp.text
    summary = summary_resp.json()
    assert "total_accounts_balance" in summary
    assert "receivables_open" in summary
    assert "payables_open" in summary
