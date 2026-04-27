from __future__ import annotations

import pytest

from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_categories_products_and_stock_flow(client) -> None:
    session = await bootstrap_session(client)
    headers = session["headers"]

    category_response = await client.post(
        "/api/v1/categories",
        json={"name": "Argamassas", "description": "Linha principal"},
        headers=headers,
    )
    assert category_response.status_code == 201, category_response.text
    category = category_response.json()

    product_response = await client.post(
        "/api/v1/products",
        json={
            "sku": "ARG-001",
            "name": "Argamassa ACIII",
            "category_id": category["id"],
            "unit": "SC",
            "cost_price": 25.5,
            "sale_price": 39.9,
            "min_stock": 10,
        },
        headers=headers,
    )
    assert product_response.status_code == 201, product_response.text
    product = product_response.json()

    movement_response = await client.post(
        "/api/v1/stock/movements",
        json={
            "product_id": product["id"],
            "type": "inbound",
            "quantity": 35,
            "notes": "Carga inicial",
        },
        headers=headers,
    )
    assert movement_response.status_code == 201, movement_response.text
    assert movement_response.json()["balance_after"] == "35.000"

    balances_response = await client.get("/api/v1/stock/balances", headers=headers)
    assert balances_response.status_code == 200
    balances = balances_response.json()
    assert balances[0]["product_name"] == "Argamassa ACIII"
    assert balances[0]["quantity"] == "35.000"

    negative_response = await client.post(
        "/api/v1/stock/movements",
        json={
            "product_id": product["id"],
            "type": "outbound",
            "quantity": 100,
        },
        headers=headers,
    )
    assert negative_response.status_code == 422
