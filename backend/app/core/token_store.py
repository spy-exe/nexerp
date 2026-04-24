from __future__ import annotations

import time
from collections import defaultdict

from redis.asyncio import Redis


class BaseTokenStore:
    async def store_refresh_token(self, user_id: str, jti: str, token_hash: str, ttl_seconds: int) -> None:
        raise NotImplementedError

    async def validate_refresh_token(self, user_id: str, jti: str, token_hash: str) -> bool:
        raise NotImplementedError

    async def revoke_refresh_token(self, user_id: str, jti: str) -> None:
        raise NotImplementedError

    async def ping(self) -> None:
        raise NotImplementedError

    async def close(self) -> None:
        raise NotImplementedError


class RedisTokenStore(BaseTokenStore):
    def __init__(self, redis_url: str) -> None:
        self.redis = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        self.fallback = MemoryTokenStore()

    def _key(self, user_id: str, jti: str) -> str:
        return f"nexerp:refresh:{user_id}:{jti}"

    async def store_refresh_token(self, user_id: str, jti: str, token_hash: str, ttl_seconds: int) -> None:
        try:
            await self.redis.set(self._key(user_id, jti), token_hash, ex=ttl_seconds)
        except Exception:
            await self.fallback.store_refresh_token(user_id, jti, token_hash, ttl_seconds)

    async def validate_refresh_token(self, user_id: str, jti: str, token_hash: str) -> bool:
        try:
            stored = await self.redis.get(self._key(user_id, jti))
            return stored == token_hash
        except Exception:
            return await self.fallback.validate_refresh_token(user_id, jti, token_hash)

    async def revoke_refresh_token(self, user_id: str, jti: str) -> None:
        try:
            await self.redis.delete(self._key(user_id, jti))
        except Exception:
            await self.fallback.revoke_refresh_token(user_id, jti)

    async def ping(self) -> None:
        await self.redis.ping()

    async def close(self) -> None:
        await self.redis.close()
        await self.fallback.close()


class MemoryTokenStore(BaseTokenStore):
    def __init__(self) -> None:
        self._store: dict[str, dict[str, str | float]] = defaultdict(dict)

    def _key(self, user_id: str, jti: str) -> str:
        return f"{user_id}:{jti}"

    async def store_refresh_token(self, user_id: str, jti: str, token_hash: str, ttl_seconds: int) -> None:
        self._store[self._key(user_id, jti)] = {
            "hash": token_hash,
            "expires_at": time.time() + ttl_seconds,
        }

    async def validate_refresh_token(self, user_id: str, jti: str, token_hash: str) -> bool:
        entry = self._store.get(self._key(user_id, jti))
        if not entry:
            return False
        if float(entry["expires_at"]) <= time.time():
            self._store.pop(self._key(user_id, jti), None)
            return False
        return entry["hash"] == token_hash

    async def revoke_refresh_token(self, user_id: str, jti: str) -> None:
        self._store.pop(self._key(user_id, jti), None)

    async def ping(self) -> None:
        return None

    async def close(self) -> None:
        self._store.clear()


def build_token_store(redis_url: str) -> BaseTokenStore:
    try:
        return RedisTokenStore(redis_url)
    except Exception:  # pragma: no cover - fallback for invalid Redis config
        return MemoryTokenStore()
