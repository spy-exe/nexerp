from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.audit import router as audit_router
from app.api.v1.categories import router as categories_router
from app.api.v1.companies import router as companies_router
from app.api.v1.customers import router as customers_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.feedbacks import router as feedbacks_router
from app.api.v1.finance import router as finance_router
from app.api.v1.fiscal import router as fiscal_router
from app.api.v1.health import router as health_router
from app.api.v1.permissions import router as permissions_router
from app.api.v1.purchases import router as purchases_router
from app.api.v1.products import router as products_router
from app.api.v1.reports import router as reports_router
from app.api.v1.sales import router as sales_router
from app.api.v1.stock import router as stock_router
from app.api.v1.subscription import router as subscription_router
from app.api.v1.suppliers import router as suppliers_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(companies_router)
api_router.include_router(dashboard_router)
api_router.include_router(customers_router)
api_router.include_router(suppliers_router)
api_router.include_router(categories_router)
api_router.include_router(products_router)
api_router.include_router(sales_router)
api_router.include_router(purchases_router)
api_router.include_router(stock_router)
api_router.include_router(finance_router)
api_router.include_router(fiscal_router)
api_router.include_router(reports_router)
api_router.include_router(audit_router)
api_router.include_router(permissions_router)
api_router.include_router(subscription_router)
api_router.include_router(feedbacks_router)
api_router.include_router(admin_router)
