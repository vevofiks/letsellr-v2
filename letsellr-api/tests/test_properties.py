import pytest
from uuid import uuid4
from app.depends.auth import get_current_user
from app.main import app
from app.modules.properties.models import Property


@pytest.mark.asyncio
async def test_create_property_owner_success(client, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner

    property_data = {
        "category": "pg",
        "intent": "rent",
        "title": "Beautiful PG in Kadavanthra",
        "description": "Luxury fully furnished PG accommodation",
        "price": 25000,
        "price_unit": "per_month",
        "deposit": 75000,
        "area": 1200,
        "bedrooms": 2,
        "bathrooms": 2,
        "furnishing": "furnished",
        "extra_details": {},
        "amenities": ["gym", "parking", "pool"],
        "photos": ["photo1.jpg", "photo2.jpg"],
        "video_link": "https://youtube.com/embed/123",
        "location": {
            "address": "Kadavanthra Road",
            "area": "Kadavanthra",
            "city": "Kochi",
            "pincode": "682020",
            "state": "Kerala",
            "latitude": 9.967,
            "longitude": 76.299,
        },
        "owner_phone": "+919876543210",
        "owner_whatsapp": "+919876543210",
    }

    response = await client.post("/api/properties", json=property_data)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["title"] == property_data["title"]
    assert res_data["category"] == "pg"
    assert res_data["intent"] == "rent"
    assert res_data["owner_role"] == "owner"
    assert res_data["status"] == "pending_review"
    assert res_data["enquiry_type"] == "whatsapp_bot"
    assert "ref" in res_data
    assert res_data["stats"] == {"views": 0, "enquiries": 0, "saves": 0}


@pytest.mark.asyncio
async def test_create_property_pg_whatsapp_bot(client, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner

    property_data = {
        "category": "pg",
        "intent": "rent",
        "title": "Cozy Single Room PG for Men",
        "price": 8000,
        "price_unit": "per_month",
        "photos": ["pg_photo.jpg"],
        "location": {
            "area": "Kadavanthra",
            "city": "Kochi",
            "pincode": "682020",
            "state": "Kerala",
        },
        "owner_phone": "+919876543210",
    }

    response = await client.post("/api/properties", json=property_data)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["category"] == "pg"
    assert res_data["enquiry_type"] == "whatsapp_bot"


@pytest.mark.asyncio
async def test_create_property_agency_forbidden_category(client, test_agency):
    app.dependency_overrides[get_current_user] = lambda: test_agency

    # Agencies are not allowed to list PGs
    property_data = {
        "category": "pg",
        "intent": "rent",
        "title": "Agency PG Attempt",
        "price": 8000,
        "price_unit": "per_month",
        "photos": ["pg_photo.jpg"],
        "location": {
            "area": "Kadavanthra",
            "city": "Kochi",
            "pincode": "682020",
            "state": "Kerala",
        },
        "owner_phone": "+919876543210",
    }

    response = await client.post("/api/properties", json=property_data)
    assert response.status_code == 403
    assert "Agencies cannot list in category: pg" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_property_agency_allowed_category(client, test_agency):
    app.dependency_overrides[get_current_user] = lambda: test_agency

    property_data = {
        "category": "commercial",
        "intent": "lease",
        "title": "Agency Commercial Space",
        "price": 100000,
        "price_unit": "per_month",
        "photos": ["comm_photo.jpg"],
        "location": {
            "area": "Kakkanad",
            "city": "Kochi",
            "pincode": "682030",
            "state": "Kerala",
        },
        "owner_phone": "+919876543212",
    }

    response = await client.post("/api/properties", json=property_data)
    assert response.status_code == 201
    assert response.json()["category"] == "commercial"
    assert response.json()["owner_role"] == "agency"


@pytest.mark.asyncio
async def test_get_property_by_id(client, db, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner
    # Insert property directly in DB
    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-GET123",
        title="Test Get Property",
        category="villa_house",
        intent="buy",
        enquiry_type="manual_chat",
        price=7500000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    response = await client.get(f"/api/properties/{prop.id}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["id"] == str(prop.id)
    assert res_data["title"] == "Test Get Property"
    assert res_data["category"] == "villa_house"


@pytest.mark.asyncio
async def test_get_property_by_ref_n8n_api_key(client, db, test_owner):
    app.dependency_overrides.pop(get_current_user, None)
    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PG1042",
        title="N8N Property Ref Test",
        category="pg",
        intent="rent",
        enquiry_type="whatsapp_bot",
        price=8000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    # Test calling by Property Code (PG1042) with N8N_API_KEY auth header
    headers = {"Authorization": "Bearer letsellr_n8n_sec_key_98324798327498"}
    response = await client.get("/api/properties/PG1042", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["ref"] == "PG1042"
    assert res_data["title"] == "N8N Property Ref Test"


@pytest.mark.asyncio
async def test_get_property_not_found(client, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner
    random_uuid = uuid4()
    response = await client.get(f"/api/properties/{random_uuid}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"


@pytest.mark.asyncio
async def test_list_public_properties(client, db, test_owner):
    # Create two properties: one live, one pending review
    prop_live = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-LIVE1",
        title="Live Villa",
        category="villa_house",
        intent="buy",
        enquiry_type="manual_chat",
        price=5000000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
        status="live",
    )
    prop_pending = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-PENDING1",
        title="Pending Villa",
        category="villa_house",
        intent="buy",
        enquiry_type="manual_chat",
        price=5000000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
        status="pending_review",
    )
    db.add_all([prop_live, prop_pending])
    await db.flush()

    # Query all public properties
    response = await client.get("/api/properties")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    properties = data["results"]
    # Only live properties should be returned
    assert len(properties) >= 1
    assert any(p["ref"] == "PROP-LIVE1" for p in properties)
    assert not any(p["ref"] == "PROP-PENDING1" for p in properties)

    # Query with filters
    response = await client.get(
        "/api/properties?category=villa_house&intent=buy&city=kochi"
    )
    assert response.status_code == 200
    filtered = response.json()["results"]
    assert len(filtered) >= 1
    assert filtered[0]["ref"] == "PROP-LIVE1"

    # Query with no match filter
    response = await client.get("/api/properties?city=NonExistentCity")
    assert response.status_code == 200
    assert len(response.json()["results"]) == 0


@pytest.mark.asyncio
async def test_update_property_owner_success(client, db, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner

    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-UPDATE1",
        title="Old Title",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    update_data = {
        "title": "New Updated Title",
        "price": 22000,
        "location": {
            "address": "Updated Address",
            "area": "Vyttila",
            "city": "Kochi",
            "pincode": "682019",
            "state": "Kerala",
        },
    }

    response = await client.patch(f"/api/properties/{prop.id}", json=update_data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["title"] == "New Updated Title"
    assert res_data["price"] == 22000
    assert res_data["location_area"] == "Vyttila"
    assert res_data["location_address"] == "Updated Address"


@pytest.mark.asyncio
async def test_update_property_unauthorized(client, db, test_owner, test_other_owner):
    # Authenticate as test_other_owner, try to update test_owner's property
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-UPDATE2",
        title="Some Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    update_data = {"title": "Malicious Update"}
    response = await client.patch(f"/api/properties/{prop.id}", json=update_data)
    assert response.status_code == 403
    assert "Not authorized to edit this property" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_property_admin_success(client, db, test_owner, test_admin):
    # Authenticate as admin, update owner's property
    app.dependency_overrides[get_current_user] = lambda: test_admin

    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-UPDATE3",
        title="Owner Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    update_data = {"title": "Admin Corrected Title"}
    response = await client.patch(f"/api/properties/{prop.id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["title"] == "Admin Corrected Title"


@pytest.mark.asyncio
async def test_delete_property_owner_success(client, db, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner

    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-DEL1",
        title="To Be Deleted",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    response = await client.delete(f"/api/properties/{prop.id}")
    assert response.status_code == 204

    # Confirm it is deleted
    get_res = await client.get(f"/api/properties/{prop.id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_delete_property_unauthorized(client, db, test_owner, test_other_owner):
    # Authenticate as test_other_owner, try to delete test_owner's property
    app.dependency_overrides[get_current_user] = lambda: test_other_owner

    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-DEL2",
        title="Owner's Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    response = await client.delete(f"/api/properties/{prop.id}")
    assert response.status_code == 403
    assert "Not authorized to delete this property" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_enquiry_link_success(client, db, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner
    # Enquiry link applies to PG/Hostel
    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-ENQ-PG",
        title="PG Hostel",
        category="pg",
        intent="rent",
        enquiry_type="whatsapp_bot",
        price=6000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    response = await client.get(f"/api/properties/ref/{prop.ref}/enquiry-link")
    assert response.status_code == 200
    link_data = response.json()
    assert "link" in link_data
    assert "wa.me/919895415718" in link_data["link"]
    assert "PROP-ENQ-PG" in link_data["link"]
    assert link_data["is_pg_or_hostel"] is True


@pytest.mark.asyncio
async def test_get_enquiry_link_invalid_category(client, db, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner
    # Non-PG categories set is_pg_or_hostel to False and route to sales number 918137090018
    prop = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-ENQ-APT",
        title="Apartment",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=25000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    db.add(prop)
    await db.flush()

    response = await client.get(f"/api/properties/ref/{prop.ref}/enquiry-link")
    assert response.status_code == 200
    link_data = response.json()
    assert "wa.me/918137090018" in link_data["link"]
    assert link_data["is_pg_or_hostel"] is False
    assert link_data["enquiry_type"] == "manual_chat"


@pytest.mark.asyncio
async def test_get_owner_properties(client, db, test_owner, test_other_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner

    p1 = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-OWN1",
        title="My Property 1",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
    )
    p2 = Property(
        owner_id=test_other_owner.id,
        owner_role="owner",
        ref="PROP-OWN2",
        title="Other's Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=25000,
        location_area="Vyttila",
        location_city="Kochi",
        location_pincode="682019",
        location_state="Kerala",
        owner_phone="+919876543211",
    )
    db.add_all([p1, p2])
    await db.flush()

    response = await client.get("/api/properties/owner/me")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["ref"] == "PROP-OWN1"


@pytest.mark.asyncio
async def test_list_properties_nearby_success(client, db, test_owner):
    # Setup coordinates: test_owner is searching from Kadavanthra (9.967, 76.299)
    # 1. Close property (approx 1.5km away)
    prop_close = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-NEAR-CLOSE",
        title="Close Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Kadavanthra",
        location_city="Kochi",
        location_pincode="682020",
        location_state="Kerala",
        owner_phone="+919876543210",
        latitude=9.960,
        longitude=76.310,
        status="live",
    )
    # 2. Medium distance property (approx 5.5km away)
    prop_medium = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-NEAR-MED",
        title="Medium Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Edappally",
        location_city="Kochi",
        location_pincode="682024",
        location_state="Kerala",
        owner_phone="+919876543210",
        latitude=10.010,
        longitude=76.320,
        status="live",
    )
    db.add_all([prop_close, prop_medium])
    await db.flush()

    response = await client.get("/api/properties?lat=9.967&lng=76.299&radius=10.0")
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
    # Verify ordering: closest first
    assert results[0]["ref"] == "PROP-NEAR-CLOSE"
    assert results[1]["ref"] == "PROP-NEAR-MED"


@pytest.mark.asyncio
async def test_list_properties_nearby_outside_radius(client, db, test_owner):
    # Search from Kadavanthra (9.967, 76.299)
    # Property far away (approx 35km away, like Aluva or further)
    prop_far = Property(
        owner_id=test_owner.id,
        owner_role="owner",
        ref="PROP-NEAR-FAR",
        title="Far Property",
        category="apartment",
        intent="rent",
        enquiry_type="manual_chat",
        price=20000,
        location_area="Aluva",
        location_city="Kochi",
        location_pincode="683101",
        location_state="Kerala",
        owner_phone="+919876543210",
        latitude=10.100,
        longitude=76.350,
        status="live",
    )
    db.add(prop_far)
    await db.flush()

    response = await client.get("/api/properties?lat=9.967&lng=76.299&radius=10.0")
    assert response.status_code == 200
    results = response.json()["results"]
    # Should not include prop_far because it is outside the 10km radius
    assert not any(p["ref"] == "PROP-NEAR-FAR" for p in results)


@pytest.mark.asyncio
async def test_list_properties_range_validation_lat_too_high(client):
    response = await client.get("/api/properties?lat=95.0&lng=76.299")
    # Native FastAPI range validation should fail with 422
    assert response.status_code == 422
    assert "Input should be less than or equal to 90" in response.text


@pytest.mark.asyncio
async def test_list_properties_range_validation_lng_too_low(client):
    response = await client.get("/api/properties?lat=9.967&lng=-190.0")
    # Native FastAPI range validation should fail with 422
    assert response.status_code == 422
    assert "Input should be greater than or equal to -180" in response.text


@pytest.mark.asyncio
async def test_list_properties_pagination(client, db, test_owner):
    # Insert 3 properties
    p_list = [
        Property(
            owner_id=test_owner.id,
            owner_role="owner",
            ref=f"PROP-PAG-{i}",
            title=f"Paginated Property {i}",
            category="apartment",
            intent="rent",
            enquiry_type="manual_chat",
            price=20000,
            location_area="Kadavanthra",
            location_city="Kochi",
            location_pincode="682020",
            location_state="Kerala",
            owner_phone="+919876543210",
            status="live",
        )
        for i in range(3)
    ]
    db.add_all(p_list)
    await db.flush()

    # Query with limit 2
    response1 = await client.get("/api/properties?limit=2")
    assert response1.status_code == 200
    results1 = response1.json()["results"]
    assert len(results1) == 2

    # Query page 2 with limit 2
    response2 = await client.get("/api/properties?limit=2&page=2")
    assert response2.status_code == 200
    results2 = response2.json()["results"]
    assert len(results2) >= 1
