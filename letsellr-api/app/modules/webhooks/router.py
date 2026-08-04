"""Module: Webhooks — Router"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
import uuid

from app.depends.db import DbSession
from app.core.config import settings
from app.modules.properties.schemas import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
)
from app.modules.properties.service import PropertyService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

router = APIRouter()


def verify_crm_secret(x_crm_secret: str = Header(...)):
    expected_secret = getattr(settings, "CRM_WEBHOOK_SECRET", "super-secret-crm-key")
    if x_crm_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid CRM Secret Key")


@router.post("/whatsapp")
async def whatsapp_webhook():
    return {"message": "WhatsApp webhook — coming in Phase 5"}


# ── CRM Property Webhooks ──────────────────────────────────────────────────


@router.post(
    "/crm/properties",
    response_model=PropertyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_crm_secret)],
)
async def crm_create_property(data: PropertyCreate, db: DbSession):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_phone(data.owner_phone)
    if not user:
        user = User(
            role="agency",
            name="CRM Agent",
            email=None,
            phone=data.owner_phone,
            preference_type="residential",
            location_city=data.location.city,
            location_area=data.location.area,
            verification_status="verified",
            status="active",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    service = PropertyService(db)
    return await service.create_property(data, user)


@router.get(
    "/crm/properties/{property_ref}",
    response_model=PropertyResponse,
    dependencies=[Depends(verify_crm_secret)],
)
async def crm_get_property(property_ref: str, db: DbSession):
    service = PropertyService(db)
    return await service.get_property(property_ref)


@router.patch(
    "/crm/properties/{property_ref}",
    response_model=PropertyResponse,
    dependencies=[Depends(verify_crm_secret)],
)
async def crm_update_property(property_ref: str, data: PropertyUpdate, db: DbSession):
    service = PropertyService(db)
    prop = await service.get_property(property_ref)

    # Create a dummy admin user to bypass authorization checks in the service
    admin_user = User(
        id=prop.owner_id,
        role="admin",
        phone="0000000000",
        name="Admin",
        location_city="",
        location_area="",
        preference_type="",
    )
    return await service.update_property(prop.id, data, admin_user)


@router.delete(
    "/crm/properties/{property_ref}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_crm_secret)],
)
async def crm_delete_property(property_ref: str, db: DbSession):
    service = PropertyService(db)
    prop = await service.get_property(property_ref)

    admin_user = User(
        id=prop.owner_id,
        role="admin",
        phone="0000000000",
        name="Admin",
        location_city="",
        location_area="",
        preference_type="",
    )
    await service.delete_property(prop.id, admin_user)
    return None
