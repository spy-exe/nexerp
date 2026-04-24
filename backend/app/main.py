from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import DatabaseManager
from app.core.rate_limit import build_rate_limiter
from app.core.token_store import build_token_store


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        await app.state.token_store.close()
        await app.state.rate_limiter.close()
        await app.state.db_manager.dispose()

    app = FastAPI(
        title=app_settings.app_name,
        version="0.1.0",
        description="API base do NexERP para autenticação, onboarding, produtos, categorias e estoque.",
        lifespan=lifespan,
    )

    app.state.settings = app_settings
    app.state.db_manager = DatabaseManager(app_settings)
    app.state.token_store = build_token_store(app_settings.redis_url)
    app.state.rate_limiter = build_rate_limiter(app_settings.redis_url)

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
            "version": "0.1.0",
            "docs": "/docs",
        }

    app.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return app


app = create_app()
