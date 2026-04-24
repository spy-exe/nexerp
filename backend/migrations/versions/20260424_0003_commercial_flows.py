"""Add sales and purchases flows.

Revision ID: 20260424_0003
Revises: 20260424_0002
Create Date: 2026-04-24 21:05:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260424_0003"
down_revision = "20260424_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sales",
        sa.Column("sale_number", sa.String(length=30), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("warehouse_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("change_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["business_parties.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["warehouse_id"], ["warehouses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "sale_number", name="uq_sales_company_number"),
    )
    op.create_index(op.f("ix_sales_company_id"), "sales", ["company_id"], unique=False)
    op.create_index(op.f("ix_sales_customer_id"), "sales", ["customer_id"], unique=False)
    op.create_index(op.f("ix_sales_user_id"), "sales", ["user_id"], unique=False)
    op.create_index(op.f("ix_sales_warehouse_id"), "sales", ["warehouse_id"], unique=False)

    op.create_table(
        "sale_items",
        sa.Column("sale_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("product_sku", sa.String(length=80), nullable=False),
        sa.Column("unit", sa.String(length=20), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sale_items_company_id"), "sale_items", ["company_id"], unique=False)
    op.create_index(op.f("ix_sale_items_product_id"), "sale_items", ["product_id"], unique=False)
    op.create_index(op.f("ix_sale_items_sale_id"), "sale_items", ["sale_id"], unique=False)

    op.create_table(
        "sale_payments",
        sa.Column("sale_id", sa.Uuid(), nullable=False),
        sa.Column("method", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sale_payments_company_id"), "sale_payments", ["company_id"], unique=False)
    op.create_index(op.f("ix_sale_payments_sale_id"), "sale_payments", ["sale_id"], unique=False)

    op.create_table(
        "purchases",
        sa.Column("purchase_number", sa.String(length=30), nullable=False),
        sa.Column("supplier_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("warehouse_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["supplier_id"], ["business_parties.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["warehouse_id"], ["warehouses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "purchase_number", name="uq_purchases_company_number"),
    )
    op.create_index(op.f("ix_purchases_company_id"), "purchases", ["company_id"], unique=False)
    op.create_index(op.f("ix_purchases_supplier_id"), "purchases", ["supplier_id"], unique=False)
    op.create_index(op.f("ix_purchases_user_id"), "purchases", ["user_id"], unique=False)
    op.create_index(op.f("ix_purchases_warehouse_id"), "purchases", ["warehouse_id"], unique=False)

    op.create_table(
        "purchase_items",
        sa.Column("purchase_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("product_sku", sa.String(length=80), nullable=False),
        sa.Column("unit", sa.String(length=20), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["purchase_id"], ["purchases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_purchase_items_company_id"), "purchase_items", ["company_id"], unique=False)
    op.create_index(op.f("ix_purchase_items_product_id"), "purchase_items", ["product_id"], unique=False)
    op.create_index(op.f("ix_purchase_items_purchase_id"), "purchase_items", ["purchase_id"], unique=False)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in ["sales", "sale_items", "sale_payments", "purchases", "purchase_items"]:
            op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY")
            op.execute(
                f"CREATE POLICY {table_name}_tenant_isolation ON {table_name} "
                "USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)"
            )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in ["purchase_items", "purchases", "sale_payments", "sale_items", "sales"]:
            op.execute(f"DROP POLICY IF EXISTS {table_name}_tenant_isolation ON {table_name}")
            op.execute(f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY")

    op.drop_index(op.f("ix_purchase_items_purchase_id"), table_name="purchase_items")
    op.drop_index(op.f("ix_purchase_items_product_id"), table_name="purchase_items")
    op.drop_index(op.f("ix_purchase_items_company_id"), table_name="purchase_items")
    op.drop_table("purchase_items")

    op.drop_index(op.f("ix_purchases_warehouse_id"), table_name="purchases")
    op.drop_index(op.f("ix_purchases_user_id"), table_name="purchases")
    op.drop_index(op.f("ix_purchases_supplier_id"), table_name="purchases")
    op.drop_index(op.f("ix_purchases_company_id"), table_name="purchases")
    op.drop_table("purchases")

    op.drop_index(op.f("ix_sale_payments_sale_id"), table_name="sale_payments")
    op.drop_index(op.f("ix_sale_payments_company_id"), table_name="sale_payments")
    op.drop_table("sale_payments")

    op.drop_index(op.f("ix_sale_items_sale_id"), table_name="sale_items")
    op.drop_index(op.f("ix_sale_items_product_id"), table_name="sale_items")
    op.drop_index(op.f("ix_sale_items_company_id"), table_name="sale_items")
    op.drop_table("sale_items")

    op.drop_index(op.f("ix_sales_warehouse_id"), table_name="sales")
    op.drop_index(op.f("ix_sales_user_id"), table_name="sales")
    op.drop_index(op.f("ix_sales_customer_id"), table_name="sales")
    op.drop_index(op.f("ix_sales_company_id"), table_name="sales")
    op.drop_table("sales")
