"""Add tenant feedbacks.

Revision ID: 20260502_0007
Revises: 20260502_0006
Create Date: 2026-05-02 18:35:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260502_0007"
down_revision = "20260502_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_feedbacks_company_id"), "feedbacks", ["company_id"], unique=False)
    op.create_index(op.f("ix_feedbacks_user_id"), "feedbacks", ["user_id"], unique=False)
    op.create_index(op.f("ix_feedbacks_created_at"), "feedbacks", ["created_at"], unique=False)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY")
        op.execute(
            "CREATE POLICY feedbacks_tenant_isolation ON feedbacks "
            "USING (current_setting('app.current_is_superadmin', true) = 'true' "
            "OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP POLICY IF EXISTS feedbacks_tenant_isolation ON feedbacks")
        op.execute("ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY")

    op.drop_index(op.f("ix_feedbacks_created_at"), table_name="feedbacks")
    op.drop_index(op.f("ix_feedbacks_user_id"), table_name="feedbacks")
    op.drop_index(op.f("ix_feedbacks_company_id"), table_name="feedbacks")
    op.drop_table("feedbacks")
