"""
Module: Users
Schemas — Pydantic models
"""

import uuid

from pydantic import BaseModel, EmailStr


class AgencyProfileResponse(BaseModel):
    display_name: str
    about: str
    logo_key: str | None
    banner_key: str | None = None
    areas_served: list[str]
    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    role: str
    name: str
    phone: str
    preference_type: str
    location_city: str
    location_area: str
    verification_status: str
    status: str
    agency_profile: AgencyProfileResponse | None = None
    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    agency_display_name: str | None = None
    location_city: str | None = None
    preference_type: str | None = None


class VerificationSubmitRequest(BaseModel):
    document_keys: list[str]


class ChangePinRequest(BaseModel):
    old_pin: str
    new_pin: str
