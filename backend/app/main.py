from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import DatabaseManager
from app.core.rate_limit import build_rate_limiter
from app.core.subscription_middleware import check_subscription_access
from app.core.token_store import build_token_store


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    openapi_tags = [
        {"name": "auth", "description": "Autenticação, refresh token, sessão atual e reset de senha."},
        {"name": "companies", "description": "Dados da empresa e onboarding operacional."},
        {"name": "dashboard", "description": "KPIs comerciais e alertas de estoque."},
        {"name": "customers", "description": "Cadastro de clientes com validação brasileira."},
        {"name": "suppliers", "description": "Cadastro de fornecedores com escopo multi-tenant."},
        {"name": "categories", "description": "Categorias de produtos."},
        {"name": "products", "description": "Catálogo de produtos, SKU e código de barras."},
        {"name": "sales", "description": "Vendas assistidas e operações PDV."},
        {"name": "purchases", "description": "Compras e entrada de estoque."},
        {"name": "stock", "description": "Saldos e movimentações de estoque."},
        {"name": "finance", "description": "Contas, transações, fluxo de caixa e exportações."},
        {"name": "fiscal", "description": "NF-e modelo 55 em homologação e documentos fiscais."},
        {"name": "reports", "description": "Relatórios avançados de vendas, estoque e financeiro."},
        {"name": "audit", "description": "Trilha de auditoria para ações críticas."},
        {"name": "permissions", "description": "Permissões granulares por módulo e papéis."},
        {"name": "subscription", "description": "Assinatura, limites de plano e uso atual."},
        {"name": "admin", "description": "Painel SaaS para superadmin."},
        {"name": "health", "description": "Health checks da aplicação."},
    ]

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        await app.state.token_store.close()
        await app.state.rate_limiter.close()
        await app.state.db_manager.dispose()

    app = FastAPI(
        title=app_settings.app_name,
        version="1.0.0",
        description=(
            "API v1 do NexERP: ERP multi-tenant brasileiro com comercial, estoque, financeiro, "
            "fiscal em homologação, auditoria e permissões granulares."
        ),
        openapi_tags=openapi_tags,
        lifespan=lifespan,
    )

    app.state.settings = app_settings
    app.state.db_manager = DatabaseManager(app_settings)
    app.state.token_store = build_token_store(app_settings.redis_url)
    app.state.rate_limiter = build_rate_limiter(app_settings.redis_url)

    @app.middleware("http")
    async def launch_security_middleware(request: Request, call_next):
        if request.url.path.startswith(app_settings.api_v1_prefix) and request.method != "OPTIONS":
            ip_address = _client_ip(request)
            rate_limit = await app.state.rate_limiter.acquire(
                f"global:{ip_address}",
                app_settings.global_rate_limit_per_minute,
                60,
            )
            if not rate_limit.allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Limite global de requisições excedido."},
                    headers={"Retry-After": str(rate_limit.retry_after)},
                )

            subscription_response = await check_subscription_access(request)
            if subscription_response is not None:
                return subscription_response

        response = await call_next(request)
        if app_settings.security_headers_enabled:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
            if app_settings.cookie_secure:
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["meta"], summary="Metadados da API")
    async def root() -> dict[str, str]:
        return {
            "name": app_settings.app_name,
            "version": "1.0.0",
            "docs": "/docs",
        }

    app.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return app


app = create_app()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is None:
        return "unknown"
    return request.client.host
