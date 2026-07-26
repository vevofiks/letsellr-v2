import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserAdminResponse(BaseModel):
    id: uuid.UUID
    role: str
    name: str
    email: EmailStr
    phone: str
    verification_status: str
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}

class VerificationRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    note: str | None
    document_keys: list[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class UpdateUserStatusRequest(BaseModel):
    status: str

class VerificationActionRequest(BaseModel):
    note: str | None = None

class DashboardStatsResponse(BaseModel):
    pending_property_reviews: int
    open_disputes: int
    total_users: int
    total_properties: int
    active_properties: int
    seekers_count: int = 0
    agencies_count: int = 0
    owners_count: int = 0
    admins_count: int = 0

class PropertyReviewActionRequest(BaseModel):
    reason: str | None = None

class PropertyTypeResponse(BaseModel):
    id: uuid.UUID
    slug: str
    label: str
    description: str
    is_active: bool
    allowed_roles: list[str]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class PropertyTypeCreate(BaseModel):
    slug: str
    label: str
    description: str = ""
    is_active: bool = True
    allowed_roles: list[str] = []

class PropertyTypeUpdate(BaseModel):
    slug: str | None = None
    label: str | None = None
    description: str | None = None
    is_active: bool | None = None
    allowed_roles: list[str] | None = None

class LocationDataResponse(BaseModel):
    id: uuid.UUID
    title: str
    google_map_url: str | None
    is_important: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class LocationDataCreate(BaseModel):
    title: str
    google_map_url: str | None = None
    is_important: bool = False

class LocationDataUpdate(BaseModel):
    title: str | None = None
    google_map_url: str | None = None
    is_important: bool | None = None
