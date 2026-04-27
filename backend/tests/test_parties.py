from __future__ import annotations

import pytest

from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_customers_and_suppliers_crud_flow(client) -> None:
    session = await bootstrap_session(client)
    headers = session["headers"]

    customer_response = await client.post(
        "/api/v1/customers",
        json={
            "person_kind": "company",
            "name": "Construtora Atlas",
            "email": "compras@atlas.com.br",
            "phone": "21999990000",
            "document_number": "11.222.333/0001-81",
            "address_zip": "22041-001",
            "address_state": "rj",
            "address_city": "Rio de Janeiro",
        },
        headers=headers,
    )
    assert customer_response.status_code == 201, customer_response.text
    customer = customer_response.json()
    assert customer["kind"] == "customer"
    assert customer["document_number"] == "11222333000181"
    assert customer["address_zip"] == "22041001"
    assert customer["address_state"] == "RJ"

    supplier_response = await client.post(
        "/api/v1/suppliers",
        json={
            "person_kind": "company",
            "name": "Cimento Forte",
            "document_number": "11.222.333/0001-81",
            "phone": "2130303030",
        },
        headers=headers,
    )
    assert supplier_response.status_code == 201, supplier_response.text
    assert supplier_response.json()["kind"] == "supplier"

    duplicate_customer_response = await client.post(
        "/api/v1/customers",
        json={
            "person_kind": "company",
            "name": "Atlas Duplicado",
            "document_number": "11.222.333/0001-81",
        },
        headers=headers,
    )
    assert duplicate_customer_response.status_code == 409

    update_response = await client.patch(
        f"/api/v1/customers/{customer['id']}",
        json={
            "person_kind": "company",
            "name": "Construtora Atlas Prime",
            "document_number": "11222333000181",
        },
        headers=headers,
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["name"] == "Construtora Atlas Prime"

    list_response = await client.get("/api/v1/customers", headers=headers)
    assert list_response.status_code == 200
    customers = list_response.json()
    assert len(customers) == 1
    assert customers[0]["name"] == "Construtora Atlas Prime"

    archive_response = await client.post(f"/api/v1/suppliers/{supplier_response.json()['id']}/archive", headers=headers)
    assert archive_response.status_code == 200
    assert archive_response.json()["is_active"] is False
