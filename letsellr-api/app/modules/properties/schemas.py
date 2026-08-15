from datetime import datetime
from typing import Literal, Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class LocationSchema(BaseModel):
    address: Optional[str] = None
    area: str = Field(..., max_length=200)
    city: str = Field(..., max_length=100)
    pincode: str = Field(..., max_length=20)
    state: str = Field(..., max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PropertyCreate(BaseModel):
    category: Literal[
        "pg", "hostel", "pg_hostel", "apartment", "flat_apartment", "villa_house", "land", "commercial", "coworking_space"
    ]
    intent: Literal["rent", "buy", "lease"]
    title: str = Field(..., max_length=300)
    description: Optional[str] = None

    price: int
    price_unit: Literal["per_month", "total"] = "total"
    deposit: Optional[int] = None

    area: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    furnishing: Optional[Literal["unfurnished", "semi", "furnished"]] = None
    gender_preference: Optional[Literal["any", "ladies", "men", "family", "couple", "bachelors"]] = None
    extra_details: Optional[dict[str, Any]] = Field(
        None, description="Flexible field for PG sharing, vacancies, etc."
    )

    amenities: list[str] = Field(default_factory=list)
    photos: list[str] = Field(..., min_length=1, max_length=10)
    video_link: Optional[str] = Field(
        None, max_length=1000, description="Direct URL or iframe embed code"
    )

    location: LocationSchema

    owner_phone: str = Field(..., max_length=20)
    owner_whatsapp: Optional[str] = Field(None, max_length=20)
    status: Optional[Literal["draft", "pending_review"]] = "pending_review"


class AdminPropertyCreate(PropertyCreate):
    """Property creation payload for the admin-side "Add Property" form.

    `listing_party` decides who the listing is attributed to: an existing
    owner/agency user (picked via `owner_id`) or the admin's own account.
    """

    listing_party: Literal["owner", "admin", "agency"]
    owner_id: Optional[UUID] = Field(
        None, description="Required when listing_party is 'owner' or 'agency'"
    )
    status: Optional[Literal["draft", "pending_review", "live"]] = "pending_review"


class PropertyUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    price: Optional[int] = None
    price_unit: Optional[Literal["per_month", "total"]] = None
    deposit: Optional[int] = None
    area: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    furnishing: Optional[Literal["unfurnished", "semi", "furnished"]] = None
    gender_preference: Optional[Literal["any", "ladies", "men", "family", "couple", "bachelors"]] = None
    extra_details: Optional[dict[str, Any]] = None
    amenities: Optional[list[str]] = None
    photos: Optional[list[str]] = Field(None, min_length=1, max_length=10)
    video_link: Optional[str] = Field(None, max_length=1000)
    location: Optional[LocationSchema] = None
    owner_phone: Optional[str] = Field(None, max_length=20)
    owner_whatsapp: Optional[str] = Field(None, max_length=20)
    status: Optional[Literal["draft", "pending_review", "inactive", "live"]] = None
    is_featured: Optional[bool] = None


class StatsSchema(BaseModel):
    views: int
    enquiries: int
    saves: int


class OwnerMinimal(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    phone: str
    role: str

    class Config:
        from_attributes = True


class PropertyResponse(BaseModel):
    id: UUID
    ref: str
    # Canonical URL segment for this listing. Optional so rows predating the
    # slug backfill still serialise; callers fall back to the id.
    slug: Optional[str] = None
    owner_id: UUID
    owner_role: str
    category: str
    intent: str
    enquiry_type: str

    title: str
    description: Optional[str]
    price: int
    price_unit: str
    deposit: Optional[int]

    area: Optional[int]
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    furnishing: Optional[str]
    gender_preference: Optional[str]
    extra_details: Optional[dict[str, Any]]

    amenities: list[str]
    photos: list[str]
    video_link: Optional[str]

    location_address: Optional[str]
    location_area: str
    location_city: str
    location_pincode: str
    location_state: str
    latitude: Optional[float]
    longitude: Optional[float]

    owner_phone: str
    owner_whatsapp: Optional[str]
    owner: Optional[OwnerMinimal] = None

    status: str
    is_featured: bool = False
    stats: StatsSchema

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Enquiry Link ───────────────────────────────────────────────────────────────


class EnquiryLinkResponse(BaseModel):
    """
    Returned by GET /api/properties/ref/{ref}/enquiry-link.

    `link` is a wa.me deep-link URL that opens a pre-filled WhatsApp chat.
    """

    ref: str
    link: str
    enquiry_type: str
    is_pg_or_hostel: bool


# ── Paginated Browse Response ──────────────────────────────────────────────────


class PropertyBrowseResponse(BaseModel):
    """Paginated wrapper for the public property list endpoint."""

    results: list[PropertyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Nearby Locations ───────────────────────────────────────────────────────────


class LocationSuggestion(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    types: list[str] = Field(default_factory=list)
    property_id: Optional[UUID] = None
    price: Optional[int] = None
    category: Optional[str] = None
    intent: Optional[str] = None
    photo: Optional[str] = None


class NearbyLocationsResponse(BaseModel):
    results: list[LocationSuggestion]


# ── Property Reports ───────────────────────────────────────────────────────────


class PropertyReportCreate(BaseModel):
    reason: str = Field(..., max_length=100)
    description: Optional[str] = None


class PropertyReportResponse(BaseModel):
    id: UUID
    property_id: UUID
    reporter_id: Optional[UUID]
    reason: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    # We might want some nested data for admin view
    property: Optional[PropertyResponse] = None

    class Config:
        from_attributes = True
