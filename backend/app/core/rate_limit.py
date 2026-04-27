from __future__ import annotations

import time
from collections import defaultdict, deque

from redis.asyncio import Redis


class RateLimitResult:
    def __init__(self, allowed: bool, retry_after: int = 0) -> None:
        self.allowed = allowed
        self.retry_after = retry_after


class BaseRateLimiter:
    async def acquire(self, bucket: str, limit: int, window_seconds: int) -> RateLimitResult:
        raise NotImplementedError

    async def ping(self) -> None:
        raise NotImplementedError

    async def close(self) -> None:
        raise NotImplementedError


class RedisRateLimiter(BaseRateLimiter):
    def __init__(self, redis_url: str) -> None:
        self.redis = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        self.fallback = MemoryRateLimiter()

    async def acquire(self, bucket: str, limit: int, window_seconds: int) -> RateLimitResult:
        try:
            now = int(time.time())
            window = now // window_seconds
            key = f"nexerp:ratelimit:{bucket}:{window}"
            count = await self.redis.incr(key)
            if count == 1:
                await self.redis.expire(key, window_seconds)
            if count > limit:
                ttl = await self.redis.ttl(key)
                return RateLimitResult(allowed=False, retry_after=max(ttl, 1))
            return RateLimitResult(allowed=True)
        except Exception:
            return await self.fallback.acquire(bucket, limit, window_seconds)

    async def ping(self) -> None:
        await self.redis.ping()

    async def close(self) -> None:
        await self.redis.close()
        await self.fallback.close()


class MemoryRateLimiter(BaseRateLimiter):
    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)

    async def acquire(self, bucket: str, limit: int, window_seconds: int) -> RateLimitResult:
        now = time.time()
        timestamps = self._buckets[bucket]
        while timestamps and timestamps[0] <= now - window_seconds:
            timestamps.popleft()
        if len(timestamps) >= limit:
            retry_after = int(window_seconds - (now - timestamps[0])) + 1
            return RateLimitResult(allowed=False, retry_after=max(retry_after, 1))
        timestamps.append(now)
        return RateLimitResult(allowed=True)

    async def ping(self) -> None:
        return None

    async def close(self) -> None:
        self._buckets.clear()


def build_rate_limiter(redis_url: str) -> BaseRateLimiter:
    try:
        return RedisRateLimiter(redis_url)
    except Exception:  # pragma: no cover - fallback for invalid Redis config
        return MemoryRateLimiter()
