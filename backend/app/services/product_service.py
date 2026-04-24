from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.audit_service import AuditService


class ProductService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def list(self, company_id: UUID) -> list[Product]:
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.company_id == company_id, Product.deleted_at.is_(None))
            .order_by(Product.name.asc())
        )
        return list(result.scalars().all())

    async def get(self, company_id: UUID, product_id: UUID) -> Product:
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(
                Product.id == product_id,
                Product.company_id == company_id,
                Product.deleted_at.is_(None),
            )
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
        return product

    async def _validate_category_scope(self, company_id: UUID, category_id: str | None) -> UUID | None:
        if category_id is None:
            return None
        category_uuid = UUID(category_id)
        result = await self.db.execute(
            select(Category.id).where(
                Category.id == category_uuid,
                Category.company_id == company_id,
                Category.deleted_at.is_(None),
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Categoria inválida.")
        return category_uuid

    async def create(self, company_id: UUID, user_id: UUID, payload: ProductCreate, ip_address: str | None) -> Product:
        category_id = await self._validate_category_scope(company_id, payload.category_id)
        product_data = payload.model_dump()
        product_data["category_id"] = category_id
        product = Product(company_id=company_id, **product_data)
        self.db.add(product)
        await self.db.flush()
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="products.created",
            table_name="products",
            record_id=str(product.id),
            new_data=payload.model_dump(mode="json"),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def update(
        self,
        company_id: UUID,
        product_id: UUID,
        user_id: UUID,
        payload: ProductUpdate,
        ip_address: str | None,
    ) -> Product:
        product = await self.get(company_id, product_id)
        category_id = await self._validate_category_scope(company_id, payload.category_id)
        previous = {
            "name": product.name,
            "barcode": product.barcode,
            "sale_price": str(product.sale_price),
            "cost_price": str(product.cost_price),
            "min_stock": str(product.min_stock),
            "is_active": product.is_active,
        }
        update_data = payload.model_dump(exclude_unset=True)
        if "category_id" in update_data:
            update_data["category_id"] = category_id
        for field, value in update_data.items():
            setattr(product, field, value)
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="products.updated",
            table_name="products",
            record_id=str(product.id),
            old_data=previous,
            new_data=payload.model_dump(exclude_unset=True, mode="json"),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def archive(self, company_id: UUID, product_id: UUID, user_id: UUID, ip_address: str | None) -> Product:
        product = await self.get(company_id, product_id)
        product.is_active = False
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="products.archived",
            table_name="products",
            record_id=str(product.id),
            old_data={"is_active": True},
            new_data={"is_active": False},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(product)
        return product
