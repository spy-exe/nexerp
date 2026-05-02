from __future__ import annotations

import pytest

from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_sales_purchases_and_dashboard_flow(client) -> None:
    session = await bootstrap_session(client)
    headers = session["headers"]

    product_response = await client.post(
        "/api/v1/products",
        json={
            "sku": "ARG-CORE-01",
            "name": "Argamassa Premium",
            "unit": "SC",
            "cost_price": 24.5,
            "sale_price": 75,
            "min_stock": 10,
        },
        headers=headers,
    )
    assert product_response.status_code == 201, product_response.text
    product = product_response.json()

    customer_response = await client.post(
        "/api/v1/customers",
        json={
            "person_kind": "company",
            "name": "Obras Horizonte",
            "document_number": "11222333000181",
            "email": "contato@horizonte.com.br",
        },
        headers=headers,
    )
    assert customer_response.status_code == 201, customer_response.text
    customer = customer_response.json()

    supplier_response = await client.post(
        "/api/v1/suppliers",
        json={
            "person_kind": "company",
            "name": "Cimento Brasil",
            "document_number": "11222333000181",
            "email": "suprimentos@cimento.com.br",
        },
        headers=headers,
    )
    assert supplier_response.status_code == 201, supplier_response.text
    supplier = supplier_response.json()

    account_response = await client.post(
        "/api/v1/finance/accounts",
        json={"name": "Caixa Operacional", "type": "cash", "balance": "1000.00"},
        headers=headers,
    )
    assert account_response.status_code == 201, account_response.text
    account = account_response.json()

    stock_response = await client.post(
        "/api/v1/stock/movements",
        json={
            "product_id": product["id"],
            "type": "inbound",
            "quantity": 20,
            "notes": "Estoque inicial",
        },
        headers=headers,
    )
    assert stock_response.status_code == 201, stock_response.text

    sale_response = await client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "channel": "sales",
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 2,
                    "unit_price": 75,
                    "discount_amount": 0,
                }
            ],
            "payments": [{"method": "pix", "amount": 150}],
        },
        headers=headers,
    )
    assert sale_response.status_code == 201, sale_response.text
    sale = sale_response.json()
    assert sale["total_amount"] == "150.00"
    assert sale["items"][0]["quantity"] == "2"

    sale_transactions_response = await client.get("/api/v1/finance/transactions?type=income", headers=headers)
    assert sale_transactions_response.status_code == 200, sale_transactions_response.text
    sale_transactions = sale_transactions_response.json()
    assert len(sale_transactions) == 1
    assert sale_transactions[0]["amount"] == "150.00"
    assert sale_transactions[0]["account_name"] == "Caixa Operacional"
    assert sale_transactions[0]["person_name"] == "Obras Horizonte"
    assert sale_transactions[0]["description"].startswith("Venda ")

    account_after_sale = await client.get(f"/api/v1/finance/accounts/{account['id']}", headers=headers)
    assert account_after_sale.status_code == 200
    assert account_after_sale.json()["balance"] == "1150.00"

    balances_after_sale = await client.get("/api/v1/stock/balances", headers=headers)
    assert balances_after_sale.status_code == 200
    assert balances_after_sale.json()[0]["quantity"] == "18.000"

    purchase_response = await client.post(
        "/api/v1/purchases",
        json={
            "supplier_id": supplier["id"],
            "create_financial_transaction": True,
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 4,
                    "unit_cost": 20,
                }
            ],
        },
        headers=headers,
    )
    assert purchase_response.status_code == 201, purchase_response.text
    purchase = purchase_response.json()
    assert purchase["total_amount"] == "80.00"

    purchase_transactions_response = await client.get("/api/v1/finance/transactions?type=expense", headers=headers)
    assert purchase_transactions_response.status_code == 200, purchase_transactions_response.text
    purchase_transactions = purchase_transactions_response.json()
    assert len(purchase_transactions) == 1
    assert purchase_transactions[0]["amount"] == "80.00"
    assert purchase_transactions[0]["account_name"] == "Caixa Operacional"
    assert purchase_transactions[0]["person_name"] == "Cimento Brasil"
    assert purchase_transactions[0]["description"].startswith("Compra ")

    account_after_purchase = await client.get(f"/api/v1/finance/accounts/{account['id']}", headers=headers)
    assert account_after_purchase.status_code == 200
    assert account_after_purchase.json()["balance"] == "1070.00"

    balances_after_purchase = await client.get("/api/v1/stock/balances", headers=headers)
    assert balances_after_purchase.status_code == 200
    assert balances_after_purchase.json()[0]["quantity"] == "22.000"

    sales_list_response = await client.get("/api/v1/sales", headers=headers)
    assert sales_list_response.status_code == 200
    assert sales_list_response.json()[0]["customer_name"] == "Obras Horizonte"

    purchase_list_response = await client.get("/api/v1/purchases", headers=headers)
    assert purchase_list_response.status_code == 200
    assert purchase_list_response.json()[0]["supplier_name"] == "Cimento Brasil"

    dashboard_response = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert dashboard_response.status_code == 200, dashboard_response.text
    dashboard = dashboard_response.json()
    assert dashboard["revenue_today"] == "150.00"
    assert dashboard["revenue_month"] == "150.00"
    assert dashboard["purchases_month"] == "80.00"
    assert dashboard["average_ticket"] == "150.00"
    assert dashboard["sales_count_today"] == 1
    assert dashboard["top_products"][0]["label"] == "Argamassa Premium"
    assert dashboard["top_customers"][0]["label"] == "Obras Horizonte"
