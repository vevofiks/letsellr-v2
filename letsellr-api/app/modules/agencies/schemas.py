"""
Module: Agencies
Pydantic Schemas — AgencyPublic, AgencyListItem
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AgencyPublicResponse(BaseModel):
    """Public-facing agency profile (merged User + AgencyProfile)."""
    id: UUID                     # User.id
    display_name: str            # AgencyProfile.display_name
    about: str                   # AgencyProfile.about
    logo_key: Optional[str]      # AgencyProfile.logo_key  (R2 object key)
    areas_served: list[str]      # AgencyProfile.areas_served
    location_city: str           # User.location_city
    location_area: str           # User.location_area
    verification_status: str     # User.verification_status
    member_since: datetime       # User.created_at

    # Counts populated by the service
    total_listings: int = 0

    class Config:
        from_attributes = True
