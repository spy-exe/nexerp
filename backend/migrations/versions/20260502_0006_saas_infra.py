"""Add SaaS subscription infrastructure.

Revision ID: 20260502_0006
Revises: 20260427_0005
Create Date: 2026-05-02 17:10:00
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from alembic import op
from sqlalchemy.dialects import postgresql
import sqlalchemy as sa


revision = "20260502_0006"
down_revision = "20260427_0005"
branch_labels = None
depends_on = None


BETA_PLAN_ID = UUID("f2dc2f10-5f6b-4e41-a642-141371838d20")
FREE_PLAN_ID = UUID("f0fe2d8a-4d08-4db6-b210-5344f9a332f1")
PRO_PLAN_ID = UUID("8e03d180-8f89-4f47-b129-73b5897333c5")
SUPERADMIN_ROLE_ID = UUID("8e2024a2-4ad6-4b72-94f4-011982df7599")
SUPERADMIN_USER_ID = UUID("cf6b18b3-7bb0-4a69-92d3-a3e46fbe9c29")
SUPERADMIN_PASSWORD_HASH = "$2b$12$7NJsU8HFMRAjCgeFqMjSbeGASdxp2pibrmlTl4eOymFA07AD7z4/a"

subscription_status = sa.Enum(
    "trialing",
    "active",
    "suspended",
    "canceled",
    "expired",
    name="subscription_status",
)
billing_status = sa.Enum(
    "pending",
    "paid",
    "failed",
    "refunded",
    name="billing_status",
)
jsonb_type = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")


def upgrade() -> None:
    now = datetime.now(tz=UTC)

    with op.batch_alter_table("roles") as batch_op:
        batch_op.alter_column("company_id", existing_type=sa.Uuid(), nullable=True)
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("company_id", existing_type=sa.Uuid(), nullable=True)

    op.create_table(
        "plans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("max_users", sa.Integer(), nullable=False),
        sa.Column("max_products", sa.Integer(), nullable=False),
        sa.Column("max_sales_per_month", sa.Integer(), nullable=False),
        sa.Column("features", jsonb_type, nullable=False),
        sa.Column("price_monthly", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_plans_slug"),
    )
    op.create_index(op.f("ix_plans_slug"), "plans", ["slug"], unique=False)

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("status", subscription_status, nullable=False),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("suspension_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", name="uq_subscriptions_company"),
    )
    op.create_index(op.f("ix_subscriptions_company_id"), "subscriptions", ["company_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_plan_id"), "subscriptions", ["plan_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_status"), "subscriptions", ["status"], unique=False)

    op.create_table(
        "billing_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("subscription_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", billing_status, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("invoice_url", sa.Text(), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_billing_history_company_id"), "billing_history", ["company_id"], unique=False)
    op.create_index(op.f("ix_billing_history_subscription_id"), "billing_history", ["subscription_id"], unique=False)
    op.create_index(op.f("ix_billing_history_status"), "billing_history", ["status"], unique=False)

    plans_table = sa.table(
        "plans",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("slug", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("max_users", sa.Integer()),
        sa.column("max_products", sa.Integer()),
        sa.column("max_sales_per_month", sa.Integer()),
        sa.column("features", jsonb_type),
        sa.column("price_monthly", sa.Numeric(12, 2)),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        plans_table,
        [
            {
                "id": BETA_PLAN_ID,
                "name": "Beta",
                "slug": "beta",
                "description": "Plano beta gratuito para empresas em onboarding.",
                "max_users": 50,
                "max_products": 9999,
                "max_sales_per_month": 9999,
                "features": {"support": "community", "beta": True},
                "price_monthly": Decimal("0.00"),
                "is_active": True,
                "created_at": now,
            },
            {
                "id": FREE_PLAN_ID,
                "name": "Free",
                "slug": "free",
                "description": "Plano gratuito com limites operacionais reduzidos.",
                "max_users": 3,
                "max_products": 100,
                "max_sales_per_month": 50,
                "features": {"support": "community"},
                "price_monthly": Decimal("0.00"),
                "is_active": True,
                "created_at": now,
            },
            {
                "id": PRO_PLAN_ID,
                "name": "Pro",
                "slug": "pro",
                "description": "Plano profissional para empresas em operação.",
                "max_users": 20,
                "max_products": 9999,
                "max_sales_per_month": 9999,
                "features": {"support": "priority", "advanced_reports": True},
                "price_monthly": Decimal("49.90"),
                "is_active": True,
                "created_at": now,
            },
        ],
    )

    roles_table = sa.table(
        "roles",
        sa.column("id", sa.Uuid()),
        sa.column("company_id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
        sa.column("permissions", sa.JSON()),
        sa.column("is_system", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    users_table = sa.table(
        "users",
        sa.column("id", sa.Uuid()),
        sa.column("company_id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("email", sa.String()),
        sa.column("password_hash", sa.String()),
        sa.column("last_login", sa.DateTime(timezone=True)),
        sa.column("is_active", sa.Boolean()),
        sa.column("deleted_at", sa.DateTime(timezone=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    user_roles_table = sa.table(
        "user_roles",
        sa.column("user_id", sa.Uuid()),
        sa.column("role_id", sa.Uuid()),
    )
    op.bulk_insert(
        roles_table,
        [
            {
                "id": SUPERADMIN_ROLE_ID,
                "company_id": None,
                "name": "superadmin",
                "description": "Administrador global do NexERP",
                "permissions": ["*"],
                "is_system": True,
                "created_at": now,
                "updated_at": now,
            }
        ],
    )
    op.bulk_insert(
        users_table,
        [
            {
                "id": SUPERADMIN_USER_ID,
                "company_id": None,
                "name": "Superadmin",
                "email": "admin@nexerp.com",
                "password_hash": SUPERADMIN_PASSWORD_HASH,
                "last_login": None,
                "is_active": True,
                "deleted_at": None,
                "created_at": now,
                "updated_at": now,
            }
        ],
    )
    op.bulk_insert(user_roles_table, [{"user_id": SUPERADMIN_USER_ID, "role_id": SUPERADMIN_ROLE_ID}])

    _seed_existing_company_subscriptions(now)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        _replace_existing_tenant_policies()
        for table_name in ["subscriptions", "billing_history"]:
            op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY")
            op.execute(
                f"CREATE POLICY {table_name}_tenant_isolation ON {table_name} "
                "USING (current_setting('app.current_is_superadmin', true) = 'true' "
                "OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
            )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in ["billing_history", "subscriptions"]:
            op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation ON {table_name}")
            op.execute(f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY")
        _restore_existing_tenant_policies()

    op.drop_index(op.f("ix_billing_history_status"), table_name="billing_history")
    op.drop_index(op.f("ix_billing_history_subscription_id"), table_name="billing_history")
    op.drop_index(op.f("ix_billing_history_company_id"), table_name="billing_history")
    op.drop_table("billing_history")

    op.drop_index(op.f("ix_subscriptions_status"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_plan_id"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_company_id"), table_name="subscriptions")
    op.drop_table("subscriptions")

    op.execute(f"DELETE FROM user_roles WHERE user_id = '{SUPERADMIN_USER_ID}'")
    op.execute(f"DELETE FROM users WHERE id = '{SUPERADMIN_USER_ID}'")
    op.execute(f"DELETE FROM roles WHERE id = '{SUPERADMIN_ROLE_ID}'")

    op.drop_index(op.f("ix_plans_slug"), table_name="plans")
    op.drop_table("plans")

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("company_id", existing_type=sa.Uuid(), nullable=False)
    with op.batch_alter_table("roles") as batch_op:
        batch_op.alter_column("company_id", existing_type=sa.Uuid(), nullable=False)

    if bind.dialect.name == "postgresql":
        billing_status.drop(bind, checkfirst=True)
        subscription_status.drop(bind, checkfirst=True)


def _seed_existing_company_subscriptions(now: datetime) -> None:
    bind = op.get_bind()
    company_ids = [row[0] for row in bind.execute(sa.text("SELECT id FROM companies")).all()]
    if not company_ids:
        return

    subscriptions_table = sa.table(
        "subscriptions",
        sa.column("id", sa.Uuid()),
        sa.column("company_id", sa.Uuid()),
        sa.column("plan_id", sa.Uuid()),
        sa.column("status", subscription_status),
        sa.column("trial_ends_at", sa.DateTime(timezone=True)),
        sa.column("current_period_start", sa.DateTime(timezone=True)),
        sa.column("current_period_end", sa.DateTime(timezone=True)),
        sa.column("canceled_at", sa.DateTime(timezone=True)),
        sa.column("suspension_reason", sa.Text()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    trial_end = now + timedelta(days=365)
    op.bulk_insert(
        subscriptions_table,
        [
            {
                "id": uuid4(),
                "company_id": UUID(str(company_id)),
                "plan_id": BETA_PLAN_ID,
                "status": "trialing",
                "trial_ends_at": trial_end,
                "current_period_start": now,
                "current_period_end": trial_end,
                "canceled_at": None,
                "suspension_reason": None,
                "created_at": now,
                "updated_at": now,
            }
            for company_id in company_ids
        ],
    )


def _replace_existing_tenant_policies() -> None:
    company_policy = (
        "USING (current_setting('app.current_is_superadmin', true) = 'true' "
        "OR id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
    )
    tenant_policy = (
        "USING (current_setting('app.current_is_superadmin', true) = 'true' "
        "OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
    )
    op.execute("DROP POLICY IF EXISTS companies_tenant_isolation ON companies")
    op.execute(f"CREATE POLICY companies_tenant_isolation ON companies {company_policy}")
    for table_name in _existing_tenant_tables():
        op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation ON {table_name}")
        op.execute(f"CREATE POLICY {table_name}_tenant_isolation ON {table_name} {tenant_policy}")


def _restore_existing_tenant_policies() -> None:
    op.execute("DROP POLICY IF EXISTS companies_tenant_isolation ON companies")
    op.execute(
        "CREATE POLICY companies_tenant_isolation ON companies "
        "USING (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
    )
    for table_name in _existing_tenant_tables():
        op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation ON {table_name}")
        op.execute(
            f"CREATE POLICY {table_name}_tenant_isolation ON {table_name} "
            "USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
        )


def _existing_tenant_tables() -> list[str]:
    return [
        "roles",
        "users",
        "audit_logs",
        "categories",
        "products",
        "warehouses",
        "stock_balances",
        "stock_movements",
        "business_parties",
        "sales",
        "sale_items",
        "sale_payments",
        "purchases",
        "purchase_items",
        "financial_accounts",
        "financial_categories",
        "financial_transactions",
        "installments",
        "fiscal_documents",
    ]
