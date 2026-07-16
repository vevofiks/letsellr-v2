import uuid
from typing import Any, Dict, List, Optional
import random
import string

from fastapi import HTTPException, status

from app.db.session import AsyncSession
from app.modules.properties.models import Property, AGENCY_ALLOWED_CATEGORIES
from app.modules.properties.repository import PropertyRepository
from app.modules.properties.schemas import PropertyCreate, PropertyUpdate
from app.modules.users.models import User


class PropertyService:
    def __init__(self, db: AsyncSession):
        self.repo = PropertyRepository(db)

    def _generate_ref(self) -> str:
        # Generate a ref like KL-EKM-0412
        chars = string.ascii_uppercase + string.digits
        random_str = "".join(random.choices(chars, k=6))
        return f"PROP-{random_str}"

    async def create_property(self, data: PropertyCreate, current_user: User) -> Property:
        if current_user.role == "agency" and data.category not in AGENCY_ALLOWED_CATEGORIES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Agencies cannot list in category: {data.category}",
            )

        enquiry_type = "whatsapp_bot" if data.category in ["pg", "hostel"] else "manual_chat"
        ref = self._generate_ref()

        # Flatten location
        location_data = data.location.model_dump()
        
        property_dict = data.model_dump(exclude={"location"})
        property_dict.update({
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
            "status": "pending_review", # Initially pending review
            "stats": {"views": 0, "enquiries": 0, "saves": 0}
        })

        return await self.repo.create(property_dict)

    async def update_property(self, property_id: str | uuid.UUID, data: PropertyUpdate, current_user: User) -> Property:
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        if prop.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to edit this property")

        update_data = data.model_dump(exclude_unset=True)
        if "location" in update_data:
            loc = update_data.pop("location")
            if "address" in loc: update_data["location_address"] = loc["address"]
            if "area" in loc: update_data["location_area"] = loc["area"]
            if "city" in loc: update_data["location_city"] = loc["city"]
            if "pincode" in loc: update_data["location_pincode"] = loc["pincode"]
            if "state" in loc: update_data["location_state"] = loc["state"]
            if "latitude" in loc: update_data["latitude"] = loc["latitude"]
            if "longitude" in loc: update_data["longitude"] = loc["longitude"]

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
        # Here we could fire "listing_viewed" background task
        return prop

    async def get_enquiry_link(self, ref: str) -> dict:
        prop = await self.repo.get_by_ref(ref)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        
        if prop.category not in ["pg", "hostel"]:
            raise HTTPException(status_code=400, detail="Enquiry link only available for PG/Hostel")
            
        # Stub WA deep link
        phone = prop.owner_phone.replace("+", "")
        wa_link = f"https://wa.me/{phone}?text=Hi%20I'm%20interested%20in%20your%20property%20{ref}"
        return {"link": wa_link}

    async def list_public_properties(self, intent: Optional[str] = None, category: Optional[str] = None, city: Optional[str] = None, page: int = 1) -> List[Property]:
        filters = {}
        if intent: filters["intent"] = intent
        if category: filters["category"] = category
        if city: filters["city"] = city
        
        limit = 20
        offset = (page - 1) * limit
        return await self.repo.list_public(filters, limit=limit, offset=offset)

    async def list_owner_properties(self, owner_id: uuid.UUID) -> List[Property]:
        return await self.repo.list_by_owner(owner_id)
