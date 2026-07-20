import pytest
from uuid import uuid4
from app.depends.auth import get_current_user
from app.main import app
from app.modules.properties.models import Property
from app.modules.reviews.models import Review


@pytest.fixture
async def test_property(db, test_owner):
    prop = Property(
        owner_id=test_owner.id,
        owner_role=test_owner.role,
        ref="PROP-REVIEW-TEST",
        title="Test Property for Reviews",
        description="A beautiful test property description.",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
        status="live"
    )
    db.add(prop)
    await db.flush()
    await db.refresh(prop)
    return prop


@pytest.mark.asyncio
async def test_create_review_success(client, test_property, test_other_owner):
    # Log in as other user (not owner of property)
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    response = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 5, "comment": "Amazing property! Highly recommended."}
    )
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["rating"] == 5
    assert res_data["comment"] == "Amazing property! Highly recommended."
    assert res_data["reviewer_name"] == test_other_owner.name
    assert res_data["user"]["name"] == test_other_owner.name
    assert res_data["user"]["role"] == test_other_owner.role


@pytest.mark.asyncio
async def test_create_review_duplicate_fails(client, test_property, test_other_owner):
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    # First review
    response = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 4, "comment": "Good place"}
    )
    assert response.status_code == 201

    # Second review (should fail)
    response2 = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 3, "comment": "Another comment"}
    )
    assert response2.status_code == 400
    assert "already submitted a review" in response2.json()["detail"]


@pytest.mark.asyncio
async def test_create_review_own_property_fails(client, test_property, test_owner):
    # Owner cannot review their own property
    app.dependency_overrides[get_current_user] = lambda: test_owner

    response = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 5, "comment": "My own property is great!"}
    )
    assert response.status_code == 403
    assert "cannot review their own properties" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_review_unauthenticated_fails(client, test_property):
    # Clear authentication override
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

    response = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 5, "comment": "Anonymous review"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_review_validation_fails(client, test_property, test_other_owner):
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    # Empty comment
    res = await client.post(f"/api/properties/{test_property.id}/reviews", json={"rating": 5, "comment": ""})
    assert res.status_code == 400

    # Whitespace only
    res = await client.post(f"/api/properties/{test_property.id}/reviews", json={"rating": 5, "comment": "   "})
    assert res.status_code == 400

    # Repeated characters
    res = await client.post(f"/api/properties/{test_property.id}/reviews", json={"rating": 5, "comment": "......"})
    assert res.status_code == 400

    res = await client.post(f"/api/properties/{test_property.id}/reviews", json={"rating": 5, "comment": "------"})
    assert res.status_code == 400

    res = await client.post(f"/api/properties/{test_property.id}/reviews", json={"rating": 5, "comment": "*****"})
    assert res.status_code == 400

    # Meaningless content / only punctuation
    res = await client.post(f"/api/properties/{test_property.id}/reviews", json={"rating": 5, "comment": "!!! ???"})
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_update_review_success(client, test_property, test_other_owner):
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    # Create first
    create_res = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 4, "comment": "Good place"}
    )
    review_id = create_res.json()["id"]

    # Update rating & comment
    update_res = await client.patch(
        f"/api/reviews/{review_id}",
        json={"rating": 5, "comment": "Actually it is amazing!"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["rating"] == 5
    assert update_res.json()["comment"] == "Actually it is amazing!"


@pytest.mark.asyncio
async def test_update_review_unauthorized_fails(client, test_property, test_other_owner, test_admin):
    # Other user creates
    app.dependency_overrides[get_current_user] = lambda: test_other_owner
    create_res = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 4, "comment": "Good place"}
    )
    review_id = create_res.json()["id"]

    # Log in as admin (unauthorized to edit someone else's review)
    app.dependency_overrides[get_current_user] = lambda: test_admin
    update_res = await client.patch(
        f"/api/reviews/{review_id}",
        json={"comment": "I want to edit this"}
    )
    assert update_res.status_code == 403


@pytest.mark.asyncio
async def test_delete_review_success(client, test_property, test_other_owner):
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    # Create first
    create_res = await client.post(
        f"/api/properties/{test_property.id}/reviews",
        json={"rating": 4, "comment": "Good place"}
    )
    review_id = create_res.json()["id"]

    # Delete
    del_res = await client.delete(f"/api/reviews/{review_id}")
    assert del_res.status_code == 204

    # Verify not found on property reviews list
    list_res = await client.get(f"/api/properties/{test_property.id}/reviews")
    assert len(list_res.json()) == 0
