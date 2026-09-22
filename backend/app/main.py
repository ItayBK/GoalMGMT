"""
GoalMGMT — FastAPI Application Entry Point.

Starts the ASGI server, initializes the database connection,
and mounts all API routers.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db


# ---------------------------------------------------------------------------
# Lifespan: runs setup on startup and teardown on shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    - On startup: create DB tables (dev convenience — use Alembic in prod).
    - On shutdown: nothing special yet, but this is where you'd close pools.
    """
    await init_db()
    yield


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description="Task Management & Self-Improvement API",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend to make requests
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME}


# ---------------------------------------------------------------------------
# Mount Routers
# ---------------------------------------------------------------------------
from app.routers import auth, missions, logs, reports, cron, users  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(missions.router, prefix="/api/missions", tags=["Missions"])
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(cron.router, prefix="/api/cron", tags=["Cron"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

