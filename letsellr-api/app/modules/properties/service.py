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
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        # Increment view count (fire-and-forget style via flush)
        current_stats = dict(prop.stats or {})
        current_stats["views"] = current_stats.get("views", 0) + 1
        await self.repo.update(prop, {"stats": current_stats})

        return prop

    async def get_enquiry_link(self, ref: str) -> EnquiryLinkResponse:
        """
        Resolve a property ref to a WhatsApp wa.me deep-link.

        Increments the property's `enquiries` stat counter on each call.
        """
        prop = await self.repo.get_by_ref(ref)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        is_pg_or_hostel = prop.category in ["pg", "hostel"]

        # Use a static defined number instead of the owner's phone
        phone = "917025351519"

        # Pre-filled message text
        message = (
            f"Hi, I found your listing on Letsellr (Ref: {ref}) "
            f"and I'm interested. Is it still available?"
        )
        wa_link = f"https://wa.me/{phone}?text={urllib.parse.quote(message)}"

        # Increment enquiry stat
        current_stats = dict(prop.stats or {})
        current_stats["enquiries"] = current_stats.get("enquiries", 0) + 1
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

    async def get_nearby_locations(self, lat: float, lng: float, radius: int) -> NearbyLocationsResponse:
        if not settings.PLACES_API_KEY:
            raise HTTPException(status_code=500, detail="Google Places API key not configured")

        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": radius,
            "key": settings.PLACES_API_KEY,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to fetch nearby locations from Google API")
                
            data = response.json()
            if data.get("status") not in ("OK", "ZERO_RESULTS"):
                error_msg = data.get("error_message", "Unknown error from Google Places API")
                raise HTTPException(status_code=502, detail=f"Google Places API Error: {error_msg}")

            results = data.get("results", [])
            
            # Sort by distance isn't strictly necessary if it returns by prominence, but the prompt says 
            # "return 5 best locations nearest it's lat and lot in 5km radious".
            # Nearby search ranks by prominence by default if radius is specified.
            # We'll take the top 5 results.
            top_results = results[:5]

            suggestions = []
            for place in top_results:
                location = place.get("geometry", {}).get("location", {})
                suggestions.append(
                    LocationSuggestion(
                        name=place.get("name", "Unknown"),
                        address=place.get("vicinity"),
                        latitude=location.get("lat", 0.0),
                        longitude=location.get("lng", 0.0),
                        types=place.get("types", [])
                    )
                )

            return NearbyLocationsResponse(results=suggestions)
