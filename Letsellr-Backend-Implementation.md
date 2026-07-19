# FastAPI Backend Implementation Plan (Letsellr v2)

## 🏆 Database Recommendation for Live Testing

For a lightning-fast, production-ready FastAPI backend, the absolute best choice is **PostgreSQL** paired with **SQLAlchemy 2.0** and the **asyncpg** driver. 

### Why PostgreSQL + asyncpg?
1. **True Asynchronous I/O:** `asyncpg` is incredibly fast (often faster than Node.js/Go equivalents) and pairs perfectly with FastAPI's `async def` endpoints.
2. **Geospatial Support:** You need map searches and location features. Postgres has **PostGIS**, the best geospatial extension in the industry.
3. **JSONB:** For flexible data (like analytics events or dynamic amenities), Postgres handles JSON natively and efficiently.

### Where to host it for "Live Testing" (Free/Cheap & Fast):
1. **Supabase (Recommended):** Gives you a fully managed Postgres DB, built-in Auth (which you need for the email trial), and R2/S3 storage.
2. **Neon.tech:** Serverless Postgres. Instant branching (like Git for databases), very generous free tier, scales instantly.
3. **Render / Railway:** Easy 1-click Postgres deployment.

**Tech Stack:** FastAPI + PostgreSQL + SQLAlchemy 2.0 (Async) + Alembic (Migrations) + Uvicorn/Gunicorn.

---

## 🚀 Step-by-Step Implementation Checklist

### Phase 1: Foundation & Setup ✅ COMPLETE
- [x] Initialize Python environment (`venv` with `.venv/`).
- [x] Install core dependencies: `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`, `firebase-admin`, `supabase`, `python-jose`, `passlib`, `boto3`, `websockets`.
- [x] Setup `app/core/config.py` — pydantic-settings `BaseSettings` for all env vars (DB URI, auth provider, R2, WhatsApp, CORS).
- [x] Setup `app/core/security.py` — JWT token creation/decoding, password hashing.
- [x] Setup `app/core/logging.py` — structured logging configured at startup.
- [x] Setup async engine + session factory (`app/db/session.py`) using asyncpg.
- [x] Setup `app/db/base.py` — declarative `Base` with `UUIDMixin` and `TimestampMixin`.
- [x] Setup `app/db/registry.py` — central model registry for Alembic autogenerate.
- [x] Setup `app/depends/db.py` — per-request async DB session dependency.
- [x] Setup `app/depends/auth.py` — Bearer token → Firebase/Supabase verify → inject `current_user`; `require_role()` RBAC guard.
- [x] Initialize Alembic with async `migrations/env.py` reading `DATABASE_URL` from settings.
- [x] Setup FastAPI app factory (`app/main.py`) with lifespan, CORS, TrustedHost, global exception handlers, health check.
- [x] Scaffold all module stubs with `router.py`, `models.py`, `service.py`, `repository.py`, `schemas.py` where applicable.
- [x] `pyproject.toml` with all dependencies, ruff, mypy, pytest config.
- [x] `.env.example` with full variable reference.
- [x] `run.py` dev server entry point.
- [x] `README.md` with setup guide.

### Phase 2: Database Models & Migrations
- [x] Create `Base` model class.
- [x] Create `User` model (id, email, role, phone, preferenceType, location, verificationStatus).
- [x] Create `AgencyProfile` model (1-to-1 with User, for agency specific data).
- [x] Create `Property` model (category, intent, price, geo-location, status, amenities, R2 photo keys).
- [x] Create `Chat` and `Message` models for in-platform manual chat.
- [x] Create `Review` and `Testimonial` models.
- [x] Create Admin/Verification request models.
- [x] Generate first Alembic migration: `alembic revision --autogenerate -m "initial_schema"`.
- [x] Apply migration: `alembic upgrade head`.

### Phase 3: Authentication & Security
- [x] Integrate Firebase Admin SDK or Supabase Python Client for token verification.
- [x] Create `depends/auth.py` dependency to extract and verify the Bearer token and inject the `current_user`.
- [x] Create `require_role(role)` dependency for RBAC (Admin, Owner, Agency).
- [x] Implement `POST /api/auth/register` (creates DB record after auth provider validates email).
- [x] Implement `GET /api/auth/me` to return current user profile.

### Phase 4: Core Property APIs
- [x] Implement `POST /api/properties` (Create listing).
    - [x] *Logic constraint:* Agencies cannot list `pg` or `hostel`.
- [x] Implement `PATCH /api/properties/{id}` (Update listing).
    - [x] *Security constraint:* Ensure `current_user.id == property.owner_id`.
- [x] Implement `DELETE /api/properties/{id}`.
- [x] Implement `GET /api/properties` (Public Browse).
    - [x] Add filters: category, intent, city, min_price, max_price, sort_by.
    - [ ] Implement Geospatial filtering (within radius) using PostGIS/SQLAlchemy `ST_DWithin`.
- [x] Implement `GET /api/properties/{id}` (Public details).
- [x] Implement `GET /api/agencies` and `/api/agencies/{id}`.

### Phase 5: Enquiry Systems (WhatsApp & Chat)
- [ ] **WhatsApp (PG/Hostel)**
    - [x] Create `GET /api/properties/ref/{ref}/enquiry-link` to generate `wa.me` URL.
    - [ ] Implement `POST /api/webhooks/whatsapp` to handle inbound bot messages.
    - [ ] Setup rate limiting/contact tracking (3 free contacts logic).
- [ ] **In-Platform Chat (Other Categories)**
    - [ ] Implement `POST /api/chats` to initialize a thread.
    - [ ] Setup `websockets` in FastAPI for real-time message delivery.
    - [ ] Implement `GET /api/chats/{id}` to fetch message history.
    - [ ] Implement `POST /api/chats/{id}/messages` (fallback for non-websocket clients).

### Phase 6: Admin MVP Dashboard APIs
- [ ] Create `GET /api/admin/users` (List clients, owners, agencies).
- [ ] Create `PATCH /api/admin/users/{id}/status` (Suspend/Activate).
- [ ] Create `GET /api/admin/verification-requests`.
- [ ] Create `POST /api/admin/verification-requests/{id}/approve` (Grants ✅ Badge).
- [ ] Create `POST /api/admin/verification-requests/{id}/reject`.
- [ ] Create `GET /api/admin/properties/queue` (Pending listings).
- [ ] Create `POST /api/admin/properties/{id}/approve` and `/reject`.
- [ ] Implement APIs for Reviews, Property Types, and Testimonial management.

### Phase 7: Polish & Deployment
- [ ] Setup Cloudflare R2 presigned URLs for image uploads (`GET /api/media/upload-url`).
- [ ] Add global exception handlers (404, 403, 500) to return consistent JSON errors.
- [ ] Write pytest tests for critical auth and property creation flows.
- [ ] Dockerize the FastAPI application.
- [ ] Deploy DB (Supabase/Neon).
- [ ] Deploy FastAPI container (Hetzner / Render / AWS).
- [ ] Setup CI/CD pipeline (GitHub Actions) for automatic deployment.
