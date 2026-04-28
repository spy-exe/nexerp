from __future__ import annotations

import pytest

from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_register_login_refresh_and_me(client) -> None:
    session = await bootstrap_session(client)

    payload = session["payload"]
    assert payload["company"]["trade_name"] == "ConcreArte"
    assert payload["user"]["email"] == "admin@concrearte.com.br"
    assert "refresh_token" in client.cookies

    me_response = await client.get("/api/v1/auth/me", headers=session["headers"])
    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["user"]["name"] == "Administrador"
    assert "*" in me_payload["permissions"]

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@concrearte.com.br", "password": "Senha@123"},
    )
    assert login_response.status_code == 200

    refresh_response = await client.post("/api/v1/auth/refresh", json={})
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]


@pytest.mark.asyncio
async def test_onboarding_accepts_blank_optional_fields(client) -> None:
    session = await bootstrap_session(client)

    response = await client.patch(
        "/api/v1/companies/me/onboarding",
        json={
            "phone": "",
            "address_zip": "",
            "address_state": "sp",
            "address_city": "São Paulo",
            "address_street": "",
            "address_number": "",
            "address_neighborhood": "",
            "tax_regime": "Simples Nacional",
            "cnae": "",
            "timezone": "",
            "currency": "brl",
        },
        headers=session["headers"],
    )

    assert response.status_code == 200, response.text
    company = response.json()
    assert company["onboarding_completed"] is True
    assert company["address_zip"] is None
    assert company["address_state"] == "SP"
    assert company["currency"] == "BRL"


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(client) -> None:
    await bootstrap_session(client)

    forgot_response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "admin@concrearte.com.br"},
    )
    assert forgot_response.status_code == 200
    debug_token = forgot_response.json()["debug_token"]
    assert debug_token

    reset_response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": debug_token, "new_password": "NovaSenha@123"},
    )
    assert reset_response.status_code == 200

    old_login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@concrearte.com.br", "password": "Senha@123"},
    )
    assert old_login_response.status_code == 401

    new_login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@concrearte.com.br", "password": "NovaSenha@123"},
    )
    assert new_login_response.status_code == 200
