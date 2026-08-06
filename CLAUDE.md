# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo for Letsellr, a no-brokerage property listing platform, with three independent projects that each need their own install/dev/build cycle:

- `letsellr-api/` — FastAPI backend (Python 3.11, PostgreSQL via SQLAlchemy 2.0 async + asyncpg)
- `frontend/` — the main web app: owner/agency/seeker dashboards + admin panel (React 19 + Vite + TypeScript + Tailwind v4 + shadcn)
- `landing-page/` — the public marketing site (Next.js 16, App Router)

There is no shared root `package.json` — always `cd` into the relevant project directory before running commands.

## `letsellr-api/` (backend)

### Setup & running
```bash
cd letsellr-api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # or: poetry install (pyproject.toml is the source of truth)
cp .env.example .env                     # fill DATABASE_URL, SECRET_KEY, AUTH_PROVIDER, etc.
python run.py                            # or: uvicorn app.main:app --reload --port 8000
```
API docs at `http://localhost:8000/api/docs` (dev only).

### Tests
```bash
pytest tests/ -v                         # full suite
pytest tests/test_properties.py -v       # single file
pytest tests/test_properties.py::test_name -v   # single test
```
Tests point at a real Postgres test DB (`letsellr_test`, see `tests/conftest.py`) — not sqlite/mocked. The `setup_test_db` fixture drops and recreates all tables each session; each test then runs inside a rolled-back transaction via the `db` fixture. `DATABASE_URL` for tests is hardcoded in `conftest.py` before `app.main` is imported, so it always wins over `.env`.

### Lint/typecheck
```bash
ruff check .        # configured in pyproject.toml, line-length 100
mypy app            # strict mode
```

### Migrations (Alembic, async)
```bash
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
alembic downgrade -1
alembic current
```
New models must be imported in `app/db/registry.py` or autogenerate won't see them.

### Architecture: modular monolith
Each feature lives in a self-contained module under `app/modules/<name>/`:
```
router.py      — FastAPI routes (API layer only)
schemas.py     — Pydantic request/response models
service.py     — business logic
repository.py  — DB queries (SQLAlchemy)
models.py      — SQLAlchemy ORM models
```
Modules talk to each other **only through service calls**, never HTTP. Not every module has all five files — some (`reviews`, `testimonials`, `webhooks`) are thinner and skip `repository.py`. `admin/testimonials` is a submodule with its own `admin_router` (mounted at `/api/admin/testimonials`) and `public_router` (mounted at `/api/testimonials`) — see `app/main.py` for the exact prefix/router wiring, which is not 1:1 (`reviews_router` self-declares its full prefix, `properties`/`users`/etc. get prefixed by `main.py`).

Shared infra:
- `app/core/` — settings (`config.py`, pydantic-settings, reads `.env`), `security.py` (JWT/password hashing), `logging.py`, `email.py` (SMTP/OTP), `supabase.py`
- `app/db/` — `session.py` (async engine/sessionmaker), `base.py` (declarative Base), `registry.py` (imports all models so Alembic/metadata sees them)
- `app/depends/` — FastAPI dependency injectors: `auth.py` (current-user extraction, provider-agnostic), `db.py` (`get_db` session dependency, overridden in tests)

Auth provider is pluggable: `AUTH_PROVIDER` env var is `supabase` or `firebase`; provider-specific logic is isolated in `app/depends/auth.py` so switching only touches `.env`.

Uploads are served statically from `/uploads` (mounted from `letsellr-api/uploads/`); media presigned-URL generation for Cloudflare R2 lives in `app/modules/media/`.

## `frontend/` (main web app)

```bash
cd frontend
npm run dev        # vite dev server
npm run build       # tsc -b && vite build
npm run lint         # eslint .
npm run preview
```

### Architecture
- Routing/pages live flat in `src/pages/` (e.g. `OwnerDashboard.tsx`, `PropertyDetailsPage.tsx`); admin-only pages are under `src/pages/admin/`.
- Route guarding is component-based: `ProtectedRoute.tsx`, `PublicRoute.tsx`, `AdminRoute.tsx` in `src/components/`.
- `src/context/AuthContext.tsx` holds auth state app-wide.
- `src/lib/api.ts` is the single axios instance every request goes through. It auto-attaches the bearer token from `localStorage` and has a response interceptor that transparently refreshes on 401 (queuing concurrent requests while a refresh is in flight) and dispatches a global `auth-logout` window event on refresh failure — don't build a second axios instance or bypass this interceptor for authenticated calls.
- `VITE_API_URL` env var points at the backend; defaults to `http://localhost:8000`.
- Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`) — use it instead of relative `../../` imports.
- UI components are shadcn-based (`src/components/ui/`, `components.json` config, style `base-nova`, Tailwind v4 via `@tailwindcss/vite`). Follow existing shadcn conventions when adding components rather than hand-rolling new primitives.
- API-calling logic outside the raw axios instance goes in `src/services/` (e.g. `adminService.ts`) — prefer extending this layer over calling `api` directly from page components for anything reused.

## `landing-page/` (marketing site)

```bash
cd landing-page
npm run dev
npm run build
npm run lint
npm run start        # serve production build
```

Next.js App Router: pages/layout in `app/`, shared UI in `components/ui/`, hooks in `hooks/` (e.g. `useScrollReveal.ts`), utilities in `lib/utils.ts`. Uses GSAP + `lenis` for scroll-driven animation and `motion` for component animation — `SmoothScroll.tsx` and `Preloader.tsx` wrap the page shell.

**Important:** this repo pins a Next.js version with breaking changes from what most training data assumes (per `landing-page/AGENTS.md`, which `landing-page/CLAUDE.md` also loads). Before writing Next.js code here, check `node_modules/next/dist/docs/` for current APIs/conventions rather than assuming familiar patterns still apply.

## Deployment

`letsellr-api` deploys via `.github/workflows/deploy.yml` on push to `main` (only when `letsellr-api/**` changes): SSHes to a VPS, pulls via sparse-checkout, installs `requirements.txt`, stops the `fastapi` systemd service, runs `alembic upgrade head`, restarts, then polls `/api/docs` for a health check. Frontend/landing-page deploy separately (Vercel — see their `vercel.json`).
