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
