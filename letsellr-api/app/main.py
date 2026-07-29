"""
Letsellr API — Application Entry Point

Modular Monolith Architecture:
  app/
  ├── core/        → config, security, logging
  ├── db/          → async engine, session, base model
  ├── depends/     → FastAPI dependency injectors (auth, db)
  ├── modules/     → Feature modules (auth, users, properties, admin, chat…)
  │   └── <module>/
  │       ├── router.py    — FastAPI routes (API layer)
  │       ├── schemas.py   — Pydantic request/response models
  │       ├── service.py   — Business logic
  │       ├── repository.py— DB access (query layer)
  │       └── models.py    — SQLAlchemy ORM models
  └── main.py      → App factory, lifespan, middleware
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import engine
import app.db.registry  # Ensures all ORM models are loaded into the registry

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.properties.router import router as properties_router
from app.modules.agencies.router import router as agencies_router
from app.modules.chat.router import router as chat_router
from app.modules.admin.router import router as admin_router
from app.modules.media.router import router as media_router
from app.modules.webhooks.router import router as webhooks_router
from app.modules.reviews.router import router as reviews_router
from app.modules.admin.testimonials.router import admin_router as admin_testimonials_router
from app.modules.admin.testimonials.router import public_router as public_testimonials_router


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Handle startup and shutdown events."""
    configure_logging()

    # Verify DB connectivity on startup
    async with engine.connect() as conn:
        await conn.execute(__import__("sqlalchemy").text("SELECT 1"))

    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} started — {settings.ENVIRONMENT}")
    yield

    # Graceful shutdown — dispose connection pool
    await engine.dispose()
    print("👋 Shutdown complete.")


# ── App Factory ────────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="No-Brokerage Property Platform API",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ─────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS_STR.split(",") if settings.CORS_ORIGINS_STR else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # if settings.ENVIRONMENT == "production":
    #     app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS_STR)

    # ── Global Exception Handlers ──────────────────────────────────────────────
    @app.exception_handler(404)
    async def not_found_handler(request, exc):
        detail = getattr(exc, "detail", "Resource not found.")
        if detail == "Not Found":
            detail = "Resource not found."
        return JSONResponse(status_code=404, content={"detail": detail})

    @app.exception_handler(500)
    async def server_error_handler(request, exc):
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    # ── Health Check ───────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "version": settings.APP_VERSION}

    # ── Register Module Routers ────────────────────────────────────────────────
    api_prefix = "/api"
    app.include_router(auth_router,       prefix=f"{api_prefix}/auth",       tags=["Auth"])
    app.include_router(users_router,      prefix=f"{api_prefix}/users",      tags=["Users"])
    app.include_router(properties_router, prefix=f"{api_prefix}/properties", tags=["Properties"])
    app.include_router(agencies_router,   prefix=f"{api_prefix}/agencies",   tags=["Agencies"])
    app.include_router(chat_router,       prefix=f"{api_prefix}/chats",      tags=["Chat"])
    app.include_router(admin_router,      prefix=f"{api_prefix}/admin",      tags=["Admin"])
    app.include_router(media_router,      prefix=f"{api_prefix}/media",      tags=["Media"])
    app.include_router(webhooks_router,   prefix=f"{api_prefix}/webhooks",   tags=["Webhooks"])
    # ── Static Uploads Mounting ────────────────────────────────────────────────
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

    app.include_router(reviews_router,    prefix=api_prefix)
    app.include_router(public_testimonials_router, prefix=f"{api_prefix}/testimonials", tags=["Testimonials"])
    app.include_router(admin_testimonials_router, prefix=f"{api_prefix}/admin/testimonials", tags=["Admin Testimonials"])

    return app


app = create_app()
# Reload trigger
