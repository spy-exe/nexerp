"""Add fiscal documents schema.

Revision ID: 20260427_0005
Revises: 20260427_0004
Create Date: 2026-04-27 21:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260427_0005"
down_revision = "20260427_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fiscal_documents",
        sa.Column("sale_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("model", sa.String(length=2), nullable=False),
        sa.Column("series", sa.String(length=3), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("environment", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("access_key", sa.String(length=44), nullable=False),
        sa.Column("protocol", sa.String(length=30), nullable=True),
        sa.Column("sefaz_endpoint", sa.String(length=255), nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("authorized_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("xml_content", sa.Text(), nullable=False),
        sa.Column("response_message", sa.String(length=500), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "access_key", name="uq_fiscal_documents_company_access_key"),
    )
    op.create_index(op.f("ix_fiscal_documents_company_id"), "fiscal_documents", ["company_id"], unique=False)
    op.create_index(op.f("ix_fiscal_documents_sale_id"), "fiscal_documents", ["sale_id"], unique=False)
    op.create_index(op.f("ix_fiscal_documents_user_id"), "fiscal_documents", ["user_id"], unique=False)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE fiscal_documents ENABLE ROW LEVEL SECURITY")
        op.execute(
            "CREATE POLICY fiscal_documents_tenant_isolation ON fiscal_documents "
            "USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP POLICY IF EXISTS fiscal_documents_tenant_isolation ON fiscal_documents")
        op.execute("ALTER TABLE fiscal_documents DISABLE ROW LEVEL SECURITY")

    op.drop_index(op.f("ix_fiscal_documents_user_id"), table_name="fiscal_documents")
    op.drop_index(op.f("ix_fiscal_documents_sale_id"), table_name="fiscal_documents")
    op.drop_index(op.f("ix_fiscal_documents_company_id"), table_name="fiscal_documents")
    op.drop_table("fiscal_documents")
