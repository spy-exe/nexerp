from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.database import Base
from app.core.rate_limit import MemoryRateLimiter
from app.core.token_store import MemoryTokenStore
from app.main import create_app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest_asyncio.fixture
async def app(tmp_path):
    database_file = tmp_path / "nexerp-test.db"
    settings = Settings(
        app_env="testing",
        secret_key="test-secret-key",
        database_url=f"sqlite+aiosqlite:///{database_file}",
        redis_url="redis://localhost:6399/0",
        allowed_origins=["http://testserver"],
    )
    application = create_app(settings)
    application.state.token_store = MemoryTokenStore()
    application.state.rate_limiter = MemoryRateLimiter()

    async with application.state.db_manager.engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    yield application

    await application.state.token_store.close()
    await application.state.rate_limiter.close()
    await application.state.db_manager.dispose()


@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
