# Letsellr API — FastAPI Backend

**Modular Monolith** architecture · **PostgreSQL + asyncpg** · **SQLAlchemy 2.0**

---

## Architecture

```
app/
├── core/               # Config, security, logging (shared infra)
├── db/                 # Async engine, session factory, Base model, model registry
├── depends/            # FastAPI dependency injectors (auth, db session)
├── modules/            # Self-contained feature modules
│   ├── auth/           # router → service → (users.repository)
│   ├── users/          # router → service → repository → models
│   ├── properties/     # router → service → repository → models
│   ├── agencies/       # router → service → repository
│   ├── chat/           # router → service → repository → models
│   ├── admin/          # router → service → repository → models
│   ├── reviews/        # models (admin-managed)
│   ├── testimonials/   # models (admin-managed)
│   ├── media/          # R2 presigned URL generation
│   └── webhooks/       # WhatsApp inbound webhook
├── main.py             # App factory, lifespan, CORS, router registration
migrations/             # Alembic async migration scripts
tests/                  # pytest-asyncio test suite
```

Each module is **self-contained**: it owns its own `router.py` (API layer), `schemas.py` (Pydantic I/O), `service.py` (business logic), `repository.py` (DB queries), and `models.py` (SQLAlchemy ORM). Modules talk to each other through **service calls only**, never through HTTP.

---

## Setup

### 1. Create virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic \
    pydantic[email] pydantic-settings python-dotenv python-jose[cryptography] \
    passlib[bcrypt] httpx python-multipart boto3 websockets firebase-admin supabase
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL, SECRET_KEY, AUTH_PROVIDER, etc.
```

### 4. Run database migrations

```bash
# Generate first migration (after editing .env with real DB URL)
alembic revision --autogenerate -m "initial_schema"

# Apply
alembic upgrade head
```

### 5. Start the dev server

```bash
python run.py
# or
uvicorn app.main:app --reload --port 8000
```

### API Docs

Open http://localhost:8000/api/docs (Swagger UI, dev mode only).

---

## Database Options (Live Testing)

| Provider | Free tier | Notes |
|---|---|---|
| **Supabase** ⭐ | 500MB, 2 projects | Managed Postgres + built-in email Auth + Realtime |
| **Neon.tech** | 10GB, instant branching | Serverless Postgres, scales to zero |
| **Render** | 90-day free Postgres | Simple 1-click setup |

**Recommendation:** Use **Supabase** — it gives you the Postgres DB, email auth (matching your trial requirement), and Realtime (for WebSocket chat) all in one dashboard.

---

## Auth Provider

Set `AUTH_PROVIDER` in `.env` to either `supabase` or `firebase`.

- **Supabase:** Fill `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- **Firebase:** Fill `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

The auth logic is isolated in `app/depends/auth.py` — switching providers only requires changing the `.env` value.

---

## Running Tests

```bash
pytest tests/ -v
```

---

## Useful Commands

```bash
# Check migration status
alembic current

# Rollback last migration
alembic downgrade -1

# Generate new migration after model changes
alembic revision --autogenerate -m "describe_change"
```
