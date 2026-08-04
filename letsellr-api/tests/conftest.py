import asyncio
import os
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Set environment variable to test database before importing app
os.environ["DATABASE_URL"] = (
    "postgresql+asyncpg://postgres:amraz@localhost:5432/letsellr_test"
)

from app.main import app
from app.db.base import Base
from app.db.session import engine
from app.depends.db import get_db
from app.modules.users.models import User, AgencyProfile


@pytest.fixture(scope="session", autouse=True)
def event_loop():
    """Create an instance of the default event loop for each test case."""
    policy = asyncio.get_event_loop_policy()
    res = policy.new_event_loop()
    yield res
    res.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    # Bind engine to metadata and create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db():
    """Provides a transactional database session for a test."""
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async_session = AsyncSession(bind=connection, expire_on_commit=False)

        yield async_session

        await async_session.close()
        await transaction.rollback()


@pytest.fixture
async def client(db):
    """Provides a test client with overridden db dependency."""

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def test_owner(db: AsyncSession):
    user = User(
        auth_provider_uid="uid_owner_1",
        role="owner",
        name="Test Owner",
        email="owner@test.com",
        email_verified=True,
        phone="+919876543210",
        preference_type="residential",
        location_city="Kochi",
        location_area="Kadavanthra",
        verification_status="verified",
        status="active",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@pytest.fixture
async def test_other_owner(db: AsyncSession):
    user = User(
        auth_provider_uid="uid_owner_2",
        role="owner",
        name="Other Owner",
        email="other_owner@test.com",
        email_verified=True,
        phone="+919876543211",
        preference_type="residential",
        location_city="Kochi",
        location_area="Vyttila",
        verification_status="verified",
        status="active",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@pytest.fixture
async def test_agency(db: AsyncSession):
    user = User(
        auth_provider_uid="uid_agency_1",
        role="agency",
        name="Test Agency",
        email="agency@test.com",
        email_verified=True,
        phone="+919876543212",
        preference_type="commercial",
        location_city="Kochi",
        location_area="Kakkanad",
        verification_status="verified",
        status="active",
    )
    db.add(user)
    await db.flush()

    agency_profile = AgencyProfile(
        user_id=user.id,
        display_name="Elite Agency",
        about="Luxury properties in Kochi",
        logo_key="elite_logo_key",
        areas_served=["Kakkanad", "Edappally"],
    )
    db.add(agency_profile)
    await db.flush()

    await db.refresh(user)
    return user


@pytest.fixture
async def test_admin(db: AsyncSession):
    user = User(
        auth_provider_uid="uid_admin_1",
        role="admin",
        name="Test Admin",
        email="admin@test.com",
        email_verified=True,
        phone="+919876543213",
        preference_type="residential",
        location_city="Kochi",
        location_area="Kadavanthra",
        verification_status="verified",
        status="active",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
