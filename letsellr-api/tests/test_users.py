"""
Letsellr API Tests — Users Module

Covers:
  GET  /api/users/me  — fetch authenticated user's profile
  PUT  /api/users/me  — update name, location_city, preference_type

Also covers the shared GET /api/auth/me endpoint.
"""

import pytest
from app.depends.auth import get_current_user
from app.main import app


# ── GET /api/users/me ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_profile_owner(client, test_owner):
    """Owner can fetch their own profile via GET /api/users/me."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    response = await client.get("/api/users/me")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(test_owner.id)
    assert data["name"] == test_owner.name
    assert data["email"] == test_owner.email
    assert data["phone"] == test_owner.phone
    assert data["role"] == "owner"
    assert data["location_city"] == test_owner.location_city
    assert data["location_area"] == test_owner.location_area
    assert data["preference_type"] == test_owner.preference_type
    assert data["verification_status"] == test_owner.verification_status
    assert data["status"] == test_owner.status
    # Owners do not have an agency_profile
    assert data["agency_profile"] is None


@pytest.mark.asyncio
async def test_get_profile_agency_includes_agency_details(client, test_agency):
    """Agency user's profile includes nested agency_profile details."""
    app.dependency_overrides[get_current_user] = lambda: test_agency

    response = await client.get("/api/users/me")
    assert response.status_code == 200

    data = response.json()
    assert data["role"] == "agency"
    assert data["agency_profile"] is not None
    agency = data["agency_profile"]
    assert agency["display_name"] == "Elite Agency"
    assert agency["about"] == "Luxury properties in Kochi"
    assert agency["logo_key"] == "elite_logo_key"
    assert "Kakkanad" in agency["areas_served"]
    assert "Edappally" in agency["areas_served"]


@pytest.mark.asyncio
async def test_get_profile_unauthenticated(client):
    """GET /api/users/me returns 403 when no auth override is provided."""
    # Clear any lingering overrides
    app.dependency_overrides.pop(get_current_user, None)

    response = await client.get("/api/users/me")
    # Without a bearer token FastAPI returns 403 (HTTPBearer raises 403 for missing scheme)
    assert response.status_code in (401, 403)


# ── GET /api/auth/me ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_me_returns_current_user(client, test_owner):
    """GET /api/auth/me returns a compact public profile for the logged-in user."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    response = await client.get("/api/auth/me")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(test_owner.id)
    assert data["email"] == test_owner.email
    assert data["role"] == "owner"
    # email_verified should be present (UserPublic schema)
    assert "email_verified" in data


# ── PUT /api/users/me ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_profile_name(client, test_owner):
    """PUT /api/users/me updates the user's name."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    payload = {"name": "Updated Owner Name"}
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "Updated Owner Name"
    # Other fields remain unchanged
    assert data["email"] == test_owner.email
    assert data["role"] == "owner"


@pytest.mark.asyncio
async def test_update_profile_location_city(client, test_owner):
    """PUT /api/users/me updates the user's location_city."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    payload = {"location_city": "Calicut, Kerala"}
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["location_city"] == "Calicut, Kerala"


@pytest.mark.asyncio
async def test_update_profile_preference_type(client, test_owner):
    """PUT /api/users/me updates the user's preference_type."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    payload = {"preference_type": "both"}
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["preference_type"] == "both"


@pytest.mark.asyncio
async def test_update_profile_all_fields(client, test_agency):
    """PUT /api/users/me can update name, location_city, and preference_type together."""
    app.dependency_overrides[get_current_user] = lambda: test_agency

    payload = {
        "name": "Elite Agency Updated",
        "location_city": "Mumbai, Maharashtra",
        "preference_type": "rent",
    }
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "Elite Agency Updated"
    assert data["location_city"] == "Mumbai, Maharashtra"
    assert data["preference_type"] == "rent"
    # Email and phone must remain unchanged (read-only)
    assert data["email"] == test_agency.email
    assert data["phone"] == test_agency.phone


@pytest.mark.asyncio
async def test_update_profile_partial_none_fields_are_ignored(client, test_owner):
    """PUT /api/users/me with None values does not overwrite existing data."""
    app.dependency_overrides[get_current_user] = lambda: test_owner
    original_name = test_owner.name
    original_city = test_owner.location_city

    # Only send preference_type — name and location_city should remain
    payload = {"preference_type": "buy"}
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["preference_type"] == "buy"
    assert data["name"] == original_name
    assert data["location_city"] == original_city


@pytest.mark.asyncio
async def test_update_profile_empty_payload_is_noop(client, test_owner):
    """PUT /api/users/me with an empty payload returns the unchanged profile."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    response = await client.put("/api/users/me", json={})
    assert response.status_code == 200

    data = response.json()
    # All original fields must be intact
    assert data["email"] == test_owner.email
    assert data["role"] == test_owner.role


@pytest.mark.asyncio
async def test_update_profile_unauthenticated(client):
    """PUT /api/users/me returns 401/403 when no auth is provided."""
    app.dependency_overrides.pop(get_current_user, None)

    response = await client.put("/api/users/me", json={"name": "Hacker"})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_update_profile_response_schema(client, test_owner):
    """PUT /api/users/me response contains all required UserProfileResponse fields."""
    app.dependency_overrides[get_current_user] = lambda: test_owner

    response = await client.put("/api/users/me", json={"name": "Schema Test User"})
    assert response.status_code == 200

    data = response.json()
    required_keys = {
        "id", "role", "name", "email", "phone",
        "preference_type", "location_city", "location_area",
        "verification_status", "status", "agency_profile",
    }
    assert required_keys.issubset(data.keys()), (
        f"Missing keys: {required_keys - data.keys()}"
    )


@pytest.mark.asyncio
async def test_update_profile_cannot_change_email(client, test_owner):
    """Email field is not accepted in the update payload (UserUpdateRequest ignores it)."""
    app.dependency_overrides[get_current_user] = lambda: test_owner
    original_email = test_owner.email

    # Even if we sneak 'email' into the payload it should be silently ignored
    payload = {"name": "No Email Change", "email": "hacker@evil.com"}
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == original_email


@pytest.mark.asyncio
async def test_update_profile_cannot_change_phone(client, test_owner):
    """Phone field is not accepted in the update payload (UserUpdateRequest ignores it)."""
    app.dependency_overrides[get_current_user] = lambda: test_owner
    original_phone = test_owner.phone

    payload = {"name": "No Phone Change", "phone": "+911234567890"}
    response = await client.put("/api/users/me", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["phone"] == original_phone


@pytest.mark.asyncio
async def test_update_profile_does_not_affect_other_user(client, test_owner, test_other_owner):
    """Updating one user's profile does not change another user's data."""
    # Update test_owner
    app.dependency_overrides[get_current_user] = lambda: test_owner
    await client.put("/api/users/me", json={"name": "Renamed Owner"})

    # Fetch test_other_owner's profile — should be untouched
    app.dependency_overrides[get_current_user] = lambda: test_other_owner
    response = await client.get("/api/users/me")
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == test_other_owner.name  # unchanged


@pytest.mark.asyncio
async def test_get_profile_admin(client, test_admin):
    """Admin user can also fetch their profile via GET /api/users/me."""
    app.dependency_overrides[get_current_user] = lambda: test_admin

    response = await client.get("/api/users/me")
    assert response.status_code == 200

    data = response.json()
    assert data["role"] == "admin"
    assert data["email"] == test_admin.email
