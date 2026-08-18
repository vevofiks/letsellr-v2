import uuid
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class AgencyProfileResponse(BaseModel):
    id: uuid.UUID
    display_name: str
    about: str
    logo_key: str | None = None
    areas_served: list[str] = []
    created_at: datetime
    model_config = {"from_attributes": True}


class UserAdminResponse(BaseModel):
    id: uuid.UUID
    role: str
    name: str
    email: EmailStr | None = None
    phone: str
    preference_type: str | None = None
    location_city: str | None = None
    location_area: str | None = None
    verification_status: str
    verification_note: str | None = None
    status: str
    created_at: datetime
    agency_profile: AgencyProfileResponse | None = None
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
    pending_kyc_reviews: int = 0
    pending_reports: int = 0
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
    image_url: str | None = None
    is_active: bool
    allowed_roles: list[str]
    display_order: int = 0
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class PropertyTypeCreate(BaseModel):
    slug: str
    label: str
    description: str = ""
    image_url: str | None = None
    is_active: bool = True
    allowed_roles: list[str] = []
    display_order: int = 0


class PropertyTypeUpdate(BaseModel):
    slug: str | None = None
    label: str | None = None
    description: str | None = None
    image_url: str | None = None
    is_active: bool | None = None
    allowed_roles: list[str] | None = None
    display_order: int | None = None


class PropertyTypeReorderItem(BaseModel):
    id: uuid.UUID
    display_order: int


class PropertyTypeReorderRequest(BaseModel):
    items: list[PropertyTypeReorderItem]


class LocationDataResponse(BaseModel):
    id: uuid.UUID
    title: str
    google_map_url: str | None
    image_url: str | None = None
    is_important: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class LocationDataCreate(BaseModel):
    title: str
    google_map_url: str | None = None
    image_url: str | None = None
    is_important: bool = False


class LocationDataUpdate(BaseModel):
    title: str | None = None
    google_map_url: str | None = None
    image_url: str | None = None
    is_important: bool | None = None


class UserLimitResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    phone: str
    msg_limit: int
    msg_usage: int
    remaining: int
    limit_reached: bool


class UserLimitUpdate(BaseModel):
    msg_limit: int
    reset_usage: bool = False
    note: str = ""
    payment_ref: str | None = None


# ── Admin Settings ───────────────────────────────────────────────────────────


class AdminNotificationSettingsResponse(BaseModel):
    notify_pending_users: bool
    notify_pending_properties: bool
    # The numbers alerts actually go to right now.
    whatsapp_recipients: list[str] = []
    # True while `whatsapp_recipients` comes from env rather than being saved here.
    using_server_default: bool = False
    model_config = {"from_attributes": True}


class AdminNotificationSettingsUpdate(BaseModel):
    notify_pending_users: bool | None = None
    notify_pending_properties: bool | None = None
    whatsapp_recipients: list[str] | None = None


class AdminCredentialsUpdate(BaseModel):
    current_password: str = Field(min_length=1)
    new_email: EmailStr | None = None
    new_password: str | None = Field(default=None, min_length=8)


class AdminAccountResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr | None = None
    phone: str
    model_config = {"from_attributes": True}
