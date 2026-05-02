from __future__ import annotations

import pytest
from sqlalchemy import select

from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from tests.helpers import bootstrap_session


@pytest.mark.asyncio
async def test_subscription_usage_endpoint(client) -> None:
    session = await bootstrap_session(client)

    response = await client.get("/api/v1/subscription/usage", headers=session["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["plan"]["slug"] == "beta"
    assert payload["status"] == "trialing"
    assert payload["usage"]["users"]["current"] == 1
    assert payload["usage"]["users"]["limit"] == 50


@pytest.mark.asyncio
async def test_superadmin_can_manage_company_subscription(app, client) -> None:
    session = await bootstrap_session(client)
    company_id = session["payload"]["company"]["id"]
    await _create_superadmin(app)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@nexerp.com", "password": "NexAdmin@2026"},
    )
    assert login_response.status_code == 200, login_response.text
    admin_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    companies_response = await client.get("/api/v1/admin/companies", headers=admin_headers)
    assert companies_response.status_code == 200
    assert companies_response.json()[0]["company"]["id"] == company_id

    suspend_response = await client.patch(
        f"/api/v1/admin/companies/{company_id}/suspend",
        headers=admin_headers,
        json={"reason": "Teste operacional"},
    )
    assert suspend_response.status_code == 200
    assert suspend_response.json()["status"] == "suspended"

    blocked_response = await client.get("/api/v1/auth/me", headers=session["headers"])
    assert blocked_response.status_code == 403
    assert blocked_response.json()["detail"] == "Conta suspensa. Entre em contato com o suporte."


@pytest.mark.asyncio
async def test_superadmin_plan_crud(app, client) -> None:
    await _create_superadmin(app)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@nexerp.com", "password": "NexAdmin@2026"},
    )
    admin_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    create_response = await client.post(
        "/api/v1/admin/plans",
        headers=admin_headers,
        json={
            "name": "Starter",
            "slug": "starter",
            "description": "Plano de entrada",
            "max_users": 5,
            "max_products": 250,
            "max_sales_per_month": 100,
            "features": {"support": "community"},
            "price_monthly": "19.90",
            "is_active": True,
        },
    )
    assert create_response.status_code == 201, create_response.text
    plan_id = create_response.json()["id"]

    update_response = await client.patch(
        f"/api/v1/admin/plans/{plan_id}",
        headers=admin_headers,
        json={"max_users": 6},
    )
    assert update_response.status_code == 200
    assert update_response.json()["max_users"] == 6

    delete_response = await client.delete(f"/api/v1/admin/plans/{plan_id}", headers=admin_headers)
    assert delete_response.status_code == 204


@pytest.mark.asyncio
async def test_tenant_feedback_is_visible_to_superadmin(app, client) -> None:
    session = await bootstrap_session(client)

    feedback_response = await client.post(
        "/api/v1/feedbacks",
        headers=session["headers"],
        json={"message": "Fluxo de vendas ficou mais rápido.", "rating": 5},
    )
    assert feedback_response.status_code == 201, feedback_response.text
    assert feedback_response.json()["company_name"] == "ConcreArte"

    await _create_superadmin(app)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@nexerp.com", "password": "NexAdmin@2026"},
    )
    admin_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    admin_response = await client.get("/api/v1/admin/feedbacks", headers=admin_headers)
    assert admin_response.status_code == 200
    payload = admin_response.json()
    assert payload[0]["message"] == "Fluxo de vendas ficou mais rápido."
    assert payload[0]["rating"] == 5
    assert payload[0]["company_name"] == "ConcreArte"
    assert payload[0]["user_email"] == "admin@concrearte.com.br"


async def _create_superadmin(app) -> None:
    async for db in app.state.db_manager.session():
        existing = await db.execute(select(User.id).where(User.email == "admin@nexerp.com"))
        if existing.scalar_one_or_none() is not None:
            return

        role = Role(
            company_id=None,
            name="superadmin",
            description="Administrador global do NexERP",
            permissions=["*"],
            is_system=True,
        )
        user = User(
            company_id=None,
            name="Superadmin",
            email="admin@nexerp.com",
            password_hash=hash_password("NexAdmin@2026"),
        )
        user.roles.append(role)
        db.add_all([role, user])
        await db.commit()
