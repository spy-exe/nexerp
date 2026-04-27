from __future__ import annotations

import pytest

from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_fiscal_permissions_audit_and_reports_flow(client) -> None:
    session = await bootstrap_session(client)
    headers = session["headers"]

    product_response = await client.post(
        "/api/v1/products",
        json={
            "sku": "FISC-001",
            "barcode": "7891000000010",
            "name": "Produto Fiscal",
            "unit": "UN",
            "cost_price": 25,
            "sale_price": 100,
            "min_stock": 5,
        },
        headers=headers,
    )
    assert product_response.status_code == 201, product_response.text
    product = product_response.json()

    customer_response = await client.post(
        "/api/v1/customers",
        json={
            "person_kind": "company",
            "name": "Cliente Fiscal",
            "document_number": "11222333000181",
            "email": "fiscal@cliente.com.br",
        },
        headers=headers,
    )
    assert customer_response.status_code == 201, customer_response.text
    customer = customer_response.json()

    stock_response = await client.post(
        "/api/v1/stock/movements",
        json={"product_id": product["id"], "type": "inbound", "quantity": 10, "notes": "Carga fiscal"},
        headers=headers,
    )
    assert stock_response.status_code == 201, stock_response.text

    sale_response = await client.post(
        "/api/v1/sales",
        json={
            "customer_id": customer["id"],
            "channel": "pos",
            "items": [{"product_id": product["id"], "quantity": 2, "unit_price": 100, "discount_amount": 0}],
            "payments": [{"method": "pix", "amount": 200}],
        },
        headers=headers,
    )
    assert sale_response.status_code == 201, sale_response.text
    sale = sale_response.json()

    permissions_response = await client.get("/api/v1/permissions", headers=headers)
    assert permissions_response.status_code == 200, permissions_response.text
    permissions = permissions_response.json()
    assert any(permission["code"] == "fiscal:issue" for permission in permissions)

    roles_response = await client.get("/api/v1/permissions/roles", headers=headers)
    assert roles_response.status_code == 200, roles_response.text
    assert any(role["name"] == "Admin" and "*" in role["permissions"] for role in roles_response.json())

    fiscal_response = await client.post(
        f"/api/v1/fiscal/nfe/homologation/sales/{sale['id']}",
        json={"environment": "homologation"},
        headers=headers,
    )
    assert fiscal_response.status_code == 201, fiscal_response.text
    fiscal_document = fiscal_response.json()
    assert fiscal_document["status"] == "authorized_homologation"
    assert len(fiscal_document["access_key"]) == 44
    assert fiscal_document["sefaz_endpoint"].endswith("/nfeautorizacao4.asmx")
    assert "<NFe" in fiscal_document["xml_content"]

    duplicate_response = await client.post(
        f"/api/v1/fiscal/nfe/homologation/sales/{sale['id']}",
        json={"environment": "homologation"},
        headers=headers,
    )
    assert duplicate_response.status_code == 409

    fiscal_list_response = await client.get("/api/v1/fiscal/invoices", headers=headers)
    assert fiscal_list_response.status_code == 200
    assert fiscal_list_response.json()[0]["access_key"] == fiscal_document["access_key"]

    audit_response = await client.get("/api/v1/audit/logs?table_name=fiscal_documents", headers=headers)
    assert audit_response.status_code == 200, audit_response.text
    assert audit_response.json()[0]["action"] == "fiscal.nfe.homologation_issued"

    sales_report_response = await client.get("/api/v1/reports/advanced/sales", headers=headers)
    assert sales_report_response.status_code == 200, sales_report_response.text
    sales_report = sales_report_response.json()
    assert sales_report["total_revenue"] == "200.00"
    assert sales_report["total_sales"] == 1
    assert sales_report["top_products"][0]["label"] == "Produto Fiscal"

    stock_report_response = await client.get("/api/v1/reports/advanced/stock", headers=headers)
    assert stock_report_response.status_code == 200, stock_report_response.text
    assert stock_report_response.json()["items"][0]["quantity"] == "8.000"

    financial_report_response = await client.get("/api/v1/reports/advanced/financial", headers=headers)
    assert financial_report_response.status_code == 200, financial_report_response.text
    assert financial_report_response.json()["net"] == "0.00"
