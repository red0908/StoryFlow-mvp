from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings

_engine: AsyncEngine | None = None


def get_engine() -> AsyncEngine | None:
    """Return async SQLAlchemy engine when ``DATABASE_URL`` is set (e.g. postgresql+asyncpg://...)."""
    global _engine
    if not settings.database_url:
        return None
    if _engine is None:
        _engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    return _engine


async def dispose_engine() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None
