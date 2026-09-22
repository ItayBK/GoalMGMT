"""
Async database engine and session factory for Supabase (PostgreSQL).

Uses SQLAlchemy's async engine with the asyncpg driver.
The connection string is read from settings.DATABASE_URL, which should be
the Supabase pooler URI (port 6543 for transaction mode).
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel

from app.core.config import settings

# Create the async engine configured for Supabase Transaction Pooler (PgBouncer).
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
    },
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
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    except Exception as exc:
        print(f"[init_db] Note: Tables may already exist ({exc})")

