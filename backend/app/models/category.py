from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base
from app.models.base import ActivatableMixin, CompanyBoundMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.product import Product


class Category(Base, UUIDPrimaryKeyMixin, TimestampMixin, CompanyBoundMixin, ActivatableMixin):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("company_id", "name", name="uq_categories_company_name"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    parent_id = mapped_column(Uuid, ForeignKey("categories.id"))

    company: Mapped["Company"] = relationship(back_populates="categories")
    parent: Mapped["Category | None"] = relationship(remote_side="Category.id")
    products: Mapped[list["Product"]] = relationship(back_populates="category")
