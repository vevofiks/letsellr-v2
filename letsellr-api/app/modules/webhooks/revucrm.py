"""Outbound push of live listings to revucrm's property-create webhook.

Mirrors the lead-intake webhook in app/modules/auth/service.py — same CRM,
same fire-and-forget style — rather than the generic app/modules/webhooks/
outbound.py sync, which is a separate, currently-disabled bidirectional
integration with its own payload shape and endpoint.

Fired exactly once per listing, the moment it becomes publicly "live":
* Admin direct listings go live at creation time
  (PropertyService.create_property, when AdminPropertyCreate.status="live").
* Owner/agency listings can never be created as "live" (PropertyCreate.status
  only allows draft/pending_review) — they're pushed only once an admin
  approves them out of review (admin router's approve_property).
"""

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

REVUCRM_PROPERTY_CREATE_URL = (
    "https://revucrm.larahub.io/api/v1/property-create/"
    "9afd0547-29e9-4748-b997-6521f6bfe33b"
)
REVUCRM_SECRET_KEY = "scUEb4nfgOecT8YmtvfKaXRCYRCHNoAZ"

# revucrm's fixed property-type catalog, per their API field reference.
# Our `land` and `coworking_space` categories have no counterpart there
# (land is a valid `category` value on their side but has no numeric type
# id at all, and coworking_space has neither) — listings in those categories
# are skipped rather than pushed with a made-up id; see
# build_revucrm_property_payload.
CATEGORY_TO_PROPERTY_TYPE_ID = {
    "apartment": 8,
    "flat_apartment": 6,  # "flat" is its own type on their side, not "apartment"
    "villa_house": 9,
    "hostel": 11,
    "pg": 10,
    "pg_hostel": 10,  # legacy alias for "pg"; no UI produces this
    "commercial": 12,
}

# revucrm's `category` field is validated against its own fixed enum, which
# doesn't include our legacy aliases (flat_apartment, pg_hostel) — translate
# to the nearest value it accepts. Categories absent from
# CATEGORY_TO_PROPERTY_TYPE_ID (land, coworking_space) never reach here.
CATEGORY_TO_REVUCRM_CATEGORY = {
    "apartment": "apartment",
    "flat_apartment": "apartment",
    "villa_house": "villa_house",
    "hostel": "hostel",
    "pg": "pg",
    "pg_hostel": "pg",
    "commercial": "commercial",
}

# revucrm's `furnishing` field is a fixed enum (confirmed by probing the live
# endpoint) that doesn't share our model's vocabulary — sending our raw value
# (e.g. "furnished") gets rejected outright.
FURNISHING_TO_REVUCRM = {
    "unfurnished": "unfurnished",
    "semi": "semi_furnished",
    "furnished": "fully_furnished",
}


def _room_sharing_prices(extra_details: dict | None) -> list[dict]:
    room_sharing = (extra_details or {}).get("room_sharing") or []
    return [
        {"sharing": entry.get("sharing"), "price": entry.get("price")}
        for entry in room_sharing
        if isinstance(entry, dict)
    ]


def _vacancy(extra_details: dict | None) -> str:
    """"vacant" / "occupied" for PG/hostel listings, "" otherwise.

    revucrm's `vacancy` field is a two-value enum, not a count (confirmed by
    probing the live endpoint — a numeric string like "3" is rejected with
    "The selected vacancy is invalid."). Only PG/hostel listings carry
    per-sharing vacancy counts in extra_details.room_sharing; a listing is
    "vacant" there if any sharing option still has vacancy left.
    """
    room_sharing = (extra_details or {}).get("room_sharing") or []
    if not room_sharing:
        return ""
    any_vacant = any(
        isinstance(entry, dict)
        and entry.get("vacancy") not in (None, "")
        and int(entry["vacancy"]) > 0
        for entry in room_sharing
    )
    return "vacant" if any_vacant else "occupied"


def build_revucrm_property_payload(prop: Any) -> dict | None:
    """Snapshot of a live listing for revucrm.

    Returns None when the listing's category has no revucrm property type,
    in which case the caller should not push it.
    """
    property_type_id = CATEGORY_TO_PROPERTY_TYPE_ID.get(prop.category)
    if property_type_id is None:
        logger.warning(
            "Skipping revucrm push for %s: no property_type_id for category %r",
            prop.ref,
            prop.category,
        )
        return None

    return {
        "property_code": prop.ref,
        "property_title": prop.title,
        "property_type_id": property_type_id,
        "address": prop.location_address or "",
        "rent": prop.price,
        "description": prop.description or "",
        "city": prop.location_city,
        "state": prop.location_state,
        "location_area": prop.location_area,
        "pincode": prop.location_pincode,
        "category": CATEGORY_TO_REVUCRM_CATEGORY.get(prop.category, prop.category),
        "intent": prop.intent,
        "furnishing": (
            [FURNISHING_TO_REVUCRM[prop.furnishing]]
            if prop.furnishing in FURNISHING_TO_REVUCRM
            else []
        ),
        "price_unit": prop.price_unit,
        "area": prop.area,
        "deposit": prop.deposit,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "contact_number": prop.owner_phone,
        "amenities": list(prop.amenities or []),
        "latitude": prop.latitude,
        "longitude": prop.longitude,
        "room_sharing_prices": _room_sharing_prices(prop.extra_details),
        "vacancy": _vacancy(prop.extra_details),
        "status": prop.status,
    }


async def _post_to_revucrm(payload: dict, ref: str) -> None:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Secret-Key": REVUCRM_SECRET_KEY,
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                REVUCRM_PROPERTY_CREATE_URL, json=payload, headers=headers, timeout=10.0
            )
            if resp.status_code >= 400:
                # revucrm returns the specific field(s) it rejected in the body
                # (e.g. {"errors": {"furnishing.0": [...]}}) — log it, not just
                # the status code, or a rejection is undiagnosable after the fact.
                logger.error(
                    "revucrm property-create webhook rejected for %s: %s %s | payload=%s",
                    ref,
                    resp.status_code,
                    resp.text[:1000],
                    payload,
                )
            else:
                logger.info(
                    "revucrm property-create webhook fired for %s, status: %s",
                    ref,
                    resp.status_code,
                )
    except Exception as e:
        logger.error("Failed to fire revucrm property-create webhook for %s: %s", ref, e)


def dispatch_revucrm_property_webhook(prop: Any) -> None:
    """Schedules the revucrm push for a listing that just went live.

    Fire-and-forget: builds the payload synchronously (the ORM object is
    still attached to an open session here) then hands a plain dict to the
    background task, so a revucrm outage never blocks or fails the caller's
    request.
    """
    payload = build_revucrm_property_payload(prop)
    if payload is None:
        return

    try:
        asyncio.create_task(_post_to_revucrm(payload, prop.ref))
    except RuntimeError:
        logger.warning(
            "No event loop available; skipped revucrm webhook for %s", prop.ref
        )
