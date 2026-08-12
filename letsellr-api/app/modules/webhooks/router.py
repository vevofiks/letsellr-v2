"""Module: Webhooks — Router"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
import secrets

from app.depends.db import DbSession
from app.core.config import settings
from app.modules.properties.schemas import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
)
from app.modules.properties.service import PropertyService
from pydantic import Field
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

router = APIRouter()


class CrmPropertyCreate(PropertyCreate):
    """Inbound CRM listing.

    Extends the standard create payload with the CRM's own identifier. Kept
    separate from PropertyCreate so the public website endpoints cannot set it.
    """

    external_id: str | None = Field(
        default=None,
        max_length=100,
        description=(
            "The CRM's identifier for this listing. Supplying it makes delivery "
            "idempotent: replaying the same message updates the existing listing "
            "instead of creating a duplicate under a new reference code."
        ),
    )


def _crm_actor(owner_id) -> User:
    """Stand-in actor for CRM-initiated writes.

    The service layer authorises against a User, but the CRM authenticates with
    a shared secret and has no account. This is a transient object that is never
    persisted; owner_id is carried so ownership checks resolve to the listing's
    real owner.
    """
    return User(
        id=owner_id,
        role="admin",
        phone="0000000000",
        name="CRM",
        location_city="",
        location_area="",
        preference_type="",
    )


def _to_update_payload(data: "CrmPropertyCreate") -> PropertyUpdate:
    """Narrows a create payload to the fields PropertyUpdate actually accepts.

    PropertyUpdate intentionally omits category and intent — a listing does not
    change what kind of thing it is. Filtering explicitly rather than leaning on
    Pydantic's ignore-extras keeps that decision visible instead of silently
    discarding fields the CRM sent.
    """
    supplied = data.model_dump(exclude_unset=True)
    allowed = {
        key: value
        for key, value in supplied.items()
        if key in PropertyUpdate.model_fields
    }
    return PropertyUpdate(**allowed)


def verify_crm_secret(x_crm_secret: str = Header(...)):
    """Authenticates the CRM on inbound property webhooks.

    Fails closed when CRM_WEBHOOK_SECRET is unset. The previous default fell
    back to a literal committed to this repository, which left endpoints that
    create and delete listings open to anyone who had read the source.
    """
    expected_secret = settings.CRM_WEBHOOK_SECRET
    if not expected_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CRM integration is not configured",
        )
    if not secrets.compare_digest(x_crm_secret, expected_secret):
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
async def crm_create_property(data: CrmPropertyCreate, db: DbSession):
    service = PropertyService(db)

    # Idempotency. The CRM retries on timeout, and without this a message that
    # succeeded but whose response was lost would create a second listing under
    # a fresh reference code. One indexed lookup, only when the CRM supplies an
    # identifier — the reference code itself is never searched for, it is
    # allocated atomically at insert time.
    if data.external_id:
        existing = await service.repo.get_by_external_id(data.external_id)
        if existing:
            return await service.update_property(
                existing.id, _to_update_payload(data), _crm_actor(existing.owner_id)
            )

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

    return await service.create_property(
        data, user, source="crm", external_id=data.external_id
    )


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

    return await service.update_property(prop.id, data, _crm_actor(prop.owner_id))


@router.delete(
    "/crm/properties/{property_ref}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_crm_secret)],
)
async def crm_delete_property(property_ref: str, db: DbSession):
    service = PropertyService(db)
    prop = await service.get_property(property_ref)

    await service.delete_property(prop.id, _crm_actor(prop.owner_id))
    return None
