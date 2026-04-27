"""Add financial management schema.

Revision ID: 20260427_0004
Revises: 20260424_0003
Create Date: 2026-04-27 19:55:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260427_0004"
down_revision = "20260424_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "financial_accounts",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("balance", sa.Numeric(14, 2), nullable=False),
        sa.Column("bank_name", sa.String(length=100), nullable=True),
        sa.Column("agency", sa.String(length=20), nullable=True),
        sa.Column("account_number", sa.String(length=30), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_financial_accounts_company_id"), "financial_accounts", ["company_id"], unique=False)

    op.create_table(
        "financial_categories",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("parent_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["financial_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_financial_categories_company_id"), "financial_categories", ["company_id"], unique=False)

    op.create_table(
        "financial_transactions",
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=True),
        sa.Column("person_id", sa.Uuid(), nullable=True),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("reference_id", sa.Uuid(), nullable=True),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        sa.Column("reconciled", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["financial_accounts.id"]),
        sa.ForeignKeyConstraint(["category_id"], ["financial_categories.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["person_id"], ["business_parties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_financial_transactions_account_id"), "financial_transactions", ["account_id"], unique=False)
    op.create_index(op.f("ix_financial_transactions_category_id"), "financial_transactions", ["category_id"], unique=False)
    op.create_index(op.f("ix_financial_transactions_company_id"), "financial_transactions", ["company_id"], unique=False)
    op.create_index(op.f("ix_financial_transactions_date"), "financial_transactions", ["date"], unique=False)
    op.create_index(op.f("ix_financial_transactions_person_id"), "financial_transactions", ["person_id"], unique=False)

    op.create_table(
        "installments",
        sa.Column("person_id", sa.Uuid(), nullable=True),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reference_id", sa.Uuid(), nullable=True),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["person_id"], ["business_parties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_installments_company_id"), "installments", ["company_id"], unique=False)
    op.create_index(op.f("ix_installments_due_date"), "installments", ["due_date"], unique=False)
    op.create_index(op.f("ix_installments_person_id"), "installments", ["person_id"], unique=False)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in [
            "financial_accounts",
            "financial_categories",
            "financial_transactions",
            "installments",
        ]:
            op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY")
            op.execute(
                f"CREATE POLICY {table_name}_tenant_isolation ON {table_name} "
                "USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
            )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in [
            "installments",
            "financial_transactions",
            "financial_categories",
            "financial_accounts",
        ]:
            op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation ON {table_name}")
            op.execute(f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY")

    op.drop_index(op.f("ix_installments_person_id"), table_name="installments")
    op.drop_index(op.f("ix_installments_due_date"), table_name="installments")
    op.drop_index(op.f("ix_installments_company_id"), table_name="installments")
    op.drop_table("installments")

    op.drop_index(op.f("ix_financial_transactions_person_id"), table_name="financial_transactions")
    op.drop_index(op.f("ix_financial_transactions_date"), table_name="financial_transactions")
    op.drop_index(op.f("ix_financial_transactions_company_id"), table_name="financial_transactions")
    op.drop_index(op.f("ix_financial_transactions_category_id"), table_name="financial_transactions")
    op.drop_index(op.f("ix_financial_transactions_account_id"), table_name="financial_transactions")
    op.drop_table("financial_transactions")

    op.drop_index(op.f("ix_financial_categories_company_id"), table_name="financial_categories")
    op.drop_table("financial_categories")

    op.drop_index(op.f("ix_financial_accounts_company_id"), table_name="financial_accounts")
    op.drop_table("financial_accounts")
