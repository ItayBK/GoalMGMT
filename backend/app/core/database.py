"""
Async database engine and session factory for Supabase (PostgreSQL).

Uses SQLAlchemy's async engine with the asyncpg driver.
The connection string is read from settings.DATABASE_URL, which should be
the Supabase pooler URI (port 6543 for transaction mode).
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings

# Create the async engine.
# - pool_pre_ping: ensures stale connections to the remote Supabase DB are recycled.
# - echo: set to False in production; True is useful for debugging SQL queries.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Session factory — produces async sessions bound to our engine.
async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """
    FastAPI dependency that yields a database session.
    Usage in a router:
        @router.get("/items")
        async def get_items(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """
    Create all tables defined by SQLModel metadata.
    Called once on application startup.
    In production, consider using Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
