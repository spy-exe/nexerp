"""Add business parties for customers and suppliers.

Revision ID: 20260424_0002
Revises: 20260424_0001
Create Date: 2026-04-24 20:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260424_0002"
down_revision = "20260424_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "business_parties",
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("person_kind", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("document_number", sa.String(length=14), nullable=False),
        sa.Column("state_registration", sa.String(length=30), nullable=True),
        sa.Column("municipal_registration", sa.String(length=30), nullable=True),
        sa.Column("address_zip", sa.String(length=8), nullable=True),
        sa.Column("address_state", sa.String(length=2), nullable=True),
        sa.Column("address_city", sa.String(length=120), nullable=True),
        sa.Column("address_street", sa.String(length=255), nullable=True),
        sa.Column("address_number", sa.String(length=30), nullable=True),
        sa.Column("address_neighborhood", sa.String(length=120), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "kind", "document_number", name="uq_business_parties_scope_document"),
    )
    op.create_index(op.f("ix_business_parties_company_id"), "business_parties", ["company_id"], unique=False)
    op.create_index(op.f("ix_business_parties_kind"), "business_parties", ["kind"], unique=False)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE business_parties ENABLE ROW LEVEL SECURITY")
        op.execute(
            "CREATE POLICY business_parties_tenant_isolation ON business_parties "
            "USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP POLICY IF EXISTS business_parties_tenant_isolation ON business_parties")
        op.execute("ALTER TABLE business_parties DISABLE ROW LEVEL SECURITY")

    op.drop_index(op.f("ix_business_parties_kind"), table_name="business_parties")
    op.drop_index(op.f("ix_business_parties_company_id"), table_name="business_parties")
    op.drop_table("business_parties")
