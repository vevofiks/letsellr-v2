import math
import uuid
from typing import Any, Dict, List, Optional
import random
import string
import httpx

from app.core.config import settings

from fastapi import HTTPException, status
from sqlalchemy import asc, desc

from app.db.session import AsyncSession
from app.modules.properties.models import Property, AGENCY_ALLOWED_CATEGORIES
from app.modules.properties.repository import PropertyRepository
from app.modules.properties.schemas import (
    PropertyBrowseResponse,
    PropertyCreate,
    PropertyResponse,
    PropertyUpdate,
    EnquiryLinkResponse,
    NearbyLocationsResponse,
    LocationSuggestion,
)
from app.modules.users.models import User
import urllib.parse


class PropertyService:
    def __init__(self, db: AsyncSession):
        self.repo = PropertyRepository(db)

    def _generate_ref(self) -> str:
        chars = string.ascii_uppercase + string.digits
        random_str = "".join(random.choices(chars, k=6))
        return f"PROP-{random_str}"

    async def create_property(self, data: PropertyCreate, current_user: User) -> Property:
        if current_user.role == "owner" and data.category not in ["pg", "hostel"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Individual owners can only list in PG or Hostel categories.",
            )
        if current_user.role == "agency" and data.category not in AGENCY_ALLOWED_CATEGORIES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Agencies cannot list in category: {data.category}",
            )

        enquiry_type = "whatsapp_bot" if data.category in ["pg", "hostel"] else "manual_chat"
        ref = self._generate_ref()

        location_data = data.location.model_dump()
        property_dict = data.model_dump(exclude={"location"})
        property_dict.update(
            {
                "owner_id": current_user.id,
                "owner_role": current_user.role,
                "ref": ref,
                "enquiry_type": enquiry_type,   
                "location_address": location_data.get("address"),
                "location_area": location_data.get("area"),
                "location_city": location_data.get("city"),
                "location_pincode": location_data.get("pincode"),
                "location_state": location_data.get("state"),
                "latitude": location_data.get("latitude"),
                "longitude": location_data.get("longitude"),
                "status": data.status or "pending_review",
                "stats": {"views": 0, "enquiries": 0, "saves": 0},
            }
        )

        return await self.repo.create(property_dict)

    async def update_property(
        self, property_id: str | uuid.UUID, data: PropertyUpdate, current_user: User
    ) -> Property:
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        if prop.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to edit this property")

        update_data = data.model_dump(exclude_unset=True)
        if "location" in update_data:
            loc = update_data.pop("location")
            if "address" in loc:
                update_data["location_address"] = loc["address"]
            if "area" in loc:
                update_data["location_area"] = loc["area"]
            if "city" in loc:
                update_data["location_city"] = loc["city"]
            if "pincode" in loc:
                update_data["location_pincode"] = loc["pincode"]
            if "state" in loc:
                update_data["location_state"] = loc["state"]
            if "latitude" in loc:
                update_data["latitude"] = loc["latitude"]
            if "longitude" in loc:
                update_data["longitude"] = loc["longitude"]

        return await self.repo.update(prop, update_data)

    async def delete_property(self, property_id: str | uuid.UUID, current_user: User) -> None:
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        if prop.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this property")

        await self.repo.delete(prop)

    async def get_property(self, property_id: str | uuid.UUID) -> Property:
        prop = None
        # Attempt UUID lookup first if property_id is valid UUID format or UUID object
        if isinstance(property_id, uuid.UUID):
            prop = await self.repo.get_by_id(property_id)
        else:
            str_val = str(property_id).strip()
            try:
                parsed_uuid = uuid.UUID(str_val)
                prop = await self.repo.get_by_id(parsed_uuid)
            except ValueError:
                # Not a UUID, look up by property reference code (e.g. PROP-AB12CD, PG1042)
                prop = await self.repo.get_by_ref(str_val)

            if not prop:
                # Fallback: if search by UUID yielded nothing, try search by ref code
                prop = await self.repo.get_by_ref(str_val)

        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        return prop


    async def get_enquiry_link(self, ref: str, current_user_id: uuid.UUID) -> EnquiryLinkResponse:
        """
        Resolve a property ref to a WhatsApp wa.me deep-link.

        Increments the property's enquiry/leads stat counter by exactly 1 per unique user.
        """
        prop = await self.repo.get_by_ref(ref)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        is_pg_or_hostel = prop.category in ["pg", "hostel"]

        # Use a static defined number instead of the owner's phone
        phone = "15551398764"

        # Pre-filled message text
        message = (
            f"Hi, I found your listing on Letsellr (Ref: {ref}) "
            f"and I'm interested. Is it still available?"
        )
        wa_link = f"https://wa.me/{phone}?text={urllib.parse.quote(message)}"

        # Increment enquiry & views stat by 1 only when Chat on WhatsApp is clicked by a unique user
        current_stats = dict(prop.stats or {})
        viewed_by_users = current_stats.get("viewed_by_users", [])
        
        user_id_str = str(current_user_id)
        if user_id_str not in viewed_by_users:
            viewed_by_users.append(user_id_str)
            current_stats["viewed_by_users"] = viewed_by_users
            current_stats["enquiries"] = current_stats.get("enquiries", 0) + 1
            current_stats["views"] = current_stats.get("views", 0) + 1
            await self.repo.update(prop, {"stats": current_stats})

        enquiry_type = "whatsapp_bot" if is_pg_or_hostel else "manual_chat"

        return EnquiryLinkResponse(
            ref=ref,
            link=wa_link,
            enquiry_type=enquiry_type,
            is_pg_or_hostel=is_pg_or_hostel
        )

    async def list_public_properties(
        self,
        intent: Optional[str] = None,
        category: Optional[str] = None,
        city: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        sort_by: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[float] = 20.0,
        page: int = 1,
        limit: int = 20
    ) -> PropertyBrowseResponse:
        filters: Dict[str, Any] = {}
        if intent: filters["intent"] = intent
        if category: filters["category"] = category
        if city: filters["city"] = city
        if owner_id: filters["owner_id"] = owner_id
        if min_price is not None: filters["min_price"] = min_price
        if max_price is not None: filters["max_price"] = max_price
        
        offset = (page - 1) * limit
        items, total = await self.repo.list_public(
            filters=filters,
            limit=limit,
            offset=offset,
            lat=lat,
            lng=lng,
            radius=radius,
            sort_by=sort_by
        )
        
        total_pages = math.ceil(total / limit) if limit else 0
        
        return PropertyBrowseResponse(
            results=items,
            total=total,
            page=page,
            page_size=limit,
            total_pages=total_pages
        )

    async def list_owner_properties(self, owner_id: uuid.UUID) -> List[Property]:
        return await self.repo.list_by_owner(owner_id)

    async def get_nearby_locations(self, lat: float, lng: float, radius: float | int = 5000) -> NearbyLocationsResponse:
        # Normalize radius: if radius >= 100 treat as meters, else treat as kilometers
        radius_km = float(radius) / 1000.0 if radius >= 100 else float(radius)
        if radius_km <= 0:
            radius_km = 5.0

        # Query live properties with lat & lng within preferred radius
        db_props = await self.repo.get_properties_near_location(lat=lat, lng=lng, radius_km=radius_km, limit=50)

        suggestions: list[LocationSuggestion] = []
        for prop in db_props:
            photo_url = prop.photos[0] if prop.photos and len(prop.photos) > 0 else None
            addr = prop.location_address or f"{prop.location_area}, {prop.location_city}"
            suggestions.append(
                LocationSuggestion(
                    name=prop.title,
                    address=addr,
                    latitude=prop.latitude or 0.0,
                    longitude=prop.longitude or 0.0,
                    types=[prop.category, prop.intent],
                    property_id=prop.id,
                    price=prop.price,
                    category=prop.category,
                    intent=prop.intent,
                    photo=photo_url,
                )
            )

        # Optionally query Geoapify API if key is present
        if getattr(settings, "PLACES_API_KEY", None):
            try:
                url = "https://api.geoapify.com/v2/places"
                params = {
                    "categories": "commercial,building,accommodation",
                    "filter": f"circle:{lng},{lat},{int(radius_km * 1000)}",
                    "limit": 5,
                    "apiKey": settings.PLACES_API_KEY,
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        features = data.get("features", [])
                        for feature in features:
                            props = feature.get("properties", {})
                            suggestions.append(
                                LocationSuggestion(
                                    name=props.get("name") or props.get("street") or "Unknown Place",
                                    address=props.get("formatted"),
                                    latitude=props.get("lat", 0.0),
                                    longitude=props.get("lon", 0.0),
                                    types=props.get("categories", []),
                                )
                            )
            except Exception as e:
                print(f"Geoapify Error: {e}")

        return NearbyLocationsResponse(results=suggestions)

    async def report_property(self, property_id: uuid.UUID, reason: str, description: Optional[str], user_id: Optional[uuid.UUID]):
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        
        from app.modules.properties.models import PropertyReport
        report = PropertyReport(
            property_id=property_id,
            reporter_id=user_id,
            reason=reason,
            description=description,
            status="pending"
        )
        self.repo.db.add(report)
        await self.repo.db.commit()
        await self.repo.db.refresh(report)
        return report
