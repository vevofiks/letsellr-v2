"""
Covers image_url on admin location create/update — the field the admin UI now
sends when a URL is pasted instead of a file being uploaded.
"""

import pytest

from app.main import app
from app.depends.auth import get_current_user


@pytest.mark.asyncio
async def test_create_location_persists_image_url(client, test_admin):
    app.dependency_overrides[get_current_user] = lambda: test_admin
    try:
        res = await client.post(
            "/api/admin/locations",
            json={
                "title": "Kadavanthra, Kochi",
                "image_url": "https://cdn.example.com/kochi.png",
                "is_important": True,
            },
        )
        assert res.status_code == 200, res.text
        assert res.json()["image_url"] == "https://cdn.example.com/kochi.png"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_location_replaces_and_clears_image_url(client, test_admin):
    app.dependency_overrides[get_current_user] = lambda: test_admin
    try:
        created = await client.post(
            "/api/admin/locations",
            json={"title": "Panampilly Nagar", "image_url": "https://cdn.example.com/a.png"},
        )
        location_id = created.json()["id"]

        replaced = await client.patch(
            f"/api/admin/locations/{location_id}",
            json={"image_url": "https://cdn.example.com/b.png"},
        )
        assert replaced.status_code == 200, replaced.text
        assert replaced.json()["image_url"] == "https://cdn.example.com/b.png"

        # Explicit null clears it (how the UI removes an image).
        cleared = await client.patch(
            f"/api/admin/locations/{location_id}", json={"image_url": None}
        )
        assert cleared.status_code == 200, cleared.text
        assert cleared.json()["image_url"] is None

        # Omitting the field leaves the stored value alone — this is what the
        # file-upload path relies on, since the upload sets image_url itself.
        restored = await client.patch(
            f"/api/admin/locations/{location_id}",
            json={"image_url": "https://cdn.example.com/c.png"},
        )
        assert restored.json()["image_url"] == "https://cdn.example.com/c.png"

        untouched = await client.patch(
            f"/api/admin/locations/{location_id}", json={"title": "Renamed"}
        )
        assert untouched.json()["title"] == "Renamed"
        assert untouched.json()["image_url"] == "https://cdn.example.com/c.png"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_property_type_persists_image_url(client, test_admin):
    app.dependency_overrides[get_current_user] = lambda: test_admin
    try:
        res = await client.post(
            "/api/admin/property-types",
            json={
                "slug": "villa_test",
                "label": "Villa",
                "description": "Standalone homes",
                "image_url": "https://cdn.example.com/villa.png",
            },
        )
        assert res.status_code == 200, res.text
        assert res.json()["image_url"] == "https://cdn.example.com/villa.png"

        type_id = res.json()["id"]
        cleared = await client.patch(
            f"/api/admin/property-types/{type_id}", json={"image_url": None}
        )
        assert cleared.status_code == 200, cleared.text
        assert cleared.json()["image_url"] is None
    finally:
        app.dependency_overrides.clear()
