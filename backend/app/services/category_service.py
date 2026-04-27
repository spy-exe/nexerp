from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.audit_service import AuditService


class CategoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def list(self, company_id: UUID) -> list[Category]:
        result = await self.db.execute(
            select(Category)
            .where(
                Category.company_id == company_id,
                Category.deleted_at.is_(None),
            )
            .order_by(Category.name.asc())
        )
        return list(result.scalars().all())

    async def get(self, company_id: UUID, category_id: UUID) -> Category:
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.company_id == company_id,
                Category.deleted_at.is_(None),
            )
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
        return category

    async def create(self, company_id: UUID, user_id: UUID, payload: CategoryCreate, ip_address: str | None) -> Category:
        category_data = payload.model_dump()
        if category_data.get("parent_id"):
            category_data["parent_id"] = UUID(category_data["parent_id"])
        category = Category(company_id=company_id, **category_data)
        self.db.add(category)
        await self.db.flush()
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="categories.created",
            table_name="categories",
            record_id=str(category.id),
            new_data=payload.model_dump(),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def update(
        self,
        company_id: UUID,
        category_id: UUID,
        user_id: UUID,
        payload: CategoryUpdate,
        ip_address: str | None,
    ) -> Category:
        category = await self.get(company_id, category_id)
        previous = {
            "name": category.name,
            "description": category.description,
            "parent_id": str(category.parent_id) if category.parent_id else None,
            "is_active": category.is_active,
        }
        update_data = payload.model_dump(exclude_unset=True)
        if update_data.get("parent_id"):
            update_data["parent_id"] = UUID(update_data["parent_id"])
        for field, value in update_data.items():
            setattr(category, field, value)
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="categories.updated",
            table_name="categories",
            record_id=str(category.id),
            old_data=previous,
            new_data=payload.model_dump(exclude_unset=True),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def archive(self, company_id: UUID, category_id: UUID, user_id: UUID, ip_address: str | None) -> Category:
        category = await self.get(company_id, category_id)
        category.is_active = False
        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="categories.archived",
            table_name="categories",
            record_id=str(category.id),
            old_data={"is_active": True},
            new_data={"is_active": False},
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(category)
        return category
