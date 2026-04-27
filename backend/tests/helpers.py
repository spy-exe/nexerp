from __future__ import annotations

from httpx import AsyncClient


async def bootstrap_session(client: AsyncClient) -> dict:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "company": {
                "trade_name": "ConcreArte",
                "legal_name": "ConcreArte LTDA",
                "cnpj": "11222333000181",
                "email": "contato@concrearte.com.br",
                "phone": "21999999999",
            },
            "user": {
                "name": "Administrador",
                "email": "admin@concrearte.com.br",
                "password": "Senha@123",
            },
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    return {
        "payload": payload,
        "headers": {"Authorization": f"Bearer {payload['access_token']}"},
    }
