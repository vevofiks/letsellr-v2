"""Outbound delivery of listing changes to the client's CRM.

The website and the CRM both create listings, so a change made here has to be
pushed there. Two rules keep that from turning into duplicated data:

* Listings whose ``source`` is ``crm`` are never pushed back. Without that, a
  listing the CRM sent us would be echoed to the CRM, which would echo it
  back, and so on.
* The payload carries ``ref`` and ``external_id``. Those are the CRM's keys for
  deciding update-vs-insert, so a redelivered message is harmless.

Delivery is best-effort and never blocks or fails the caller's request: a CRM
outage must not stop someone listing a property on the website.
"""

import asyncio
import logging
from typing import Any, Literal

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

CrmEvent = Literal["property.created", "property.updated", "property.deleted"]

MAX_ATTEMPTS = 3
# Doubling pause between attempts. Short enough that the fire-and-forget task
# finishes promptly, long enough to ride out a restart on the CRM side.
RETRY_BASE_DELAY_SECONDS = 2.0


def build_property_payload(prop: Any) -> dict:
    """Snapshot of a listing for the CRM.

    Built from the ORM object while its session is still open — the delivery
    task outlives the request, so passing the model itself would risk touching
    a detached instance.
    """
    return {
        "ref": prop.ref,
        "external_id": prop.external_id,
        "slug": prop.slug,
        "title": prop.title,
        "description": prop.description,
        "category": prop.category,
        "intent": prop.intent,
        "status": prop.status,
        "price": prop.price,
        "price_unit": prop.price_unit,
        "deposit": prop.deposit,
        "area": prop.area,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "furnishing": prop.furnishing,
        "photos": list(prop.photos or []),
        "amenities": list(prop.amenities or []),
        "video_link": prop.video_link,
        "owner_phone": prop.owner_phone,
        "owner_whatsapp": prop.owner_whatsapp,
        "owner_role": prop.owner_role,
        "location": {
            "address": prop.location_address,
            "area": prop.location_area,
            "city": prop.location_city,
            "pincode": prop.location_pincode,
            "state": prop.location_state,
            "latitude": prop.latitude,
            "longitude": prop.longitude,
        },
        "url": f"https://app.letsellr.in/properties/{prop.slug or prop.id}",
        "created_at": prop.created_at.isoformat() if prop.created_at else None,
        "updated_at": prop.updated_at.isoformat() if prop.updated_at else None,
    }


def should_deliver(source: str | None) -> bool:
    """Whether a change to a listing from `source` should be pushed to the CRM."""
    if not settings.CRM_WEBHOOK_URL:
        return False
    # The CRM already knows about listings it gave us.
    return source != "crm"


async def _post_with_retries(body: dict) -> None:
    headers = {"Content-Type": "application/json"}
    if settings.CRM_WEBHOOK_SECRET:
        headers["X-Letsellr-Secret"] = settings.CRM_WEBHOOK_SECRET

    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            async with httpx.AsyncClient(
                timeout=settings.CRM_WEBHOOK_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(
                    settings.CRM_WEBHOOK_URL, json=body, headers=headers
                )
            if response.status_code < 400:
                return
            # 4xx means the CRM rejected the message itself; repeating it will
            # not change the outcome, so only retry server-side failures.
            if response.status_code < 500:
                logger.error(
                    "CRM webhook rejected %s for %s: %s %s",
                    body.get("event"),
                    body.get("data", {}).get("ref"),
                    response.status_code,
                    response.text[:500],
                )
                return
            last_error = RuntimeError(f"CRM responded {response.status_code}")
        except Exception as exc:  # network error, timeout, DNS, ...
            last_error = exc

        if attempt < MAX_ATTEMPTS:
            await asyncio.sleep(RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1)))

    logger.error(
        "CRM webhook failed after %s attempts for %s %s: %s",
        MAX_ATTEMPTS,
        body.get("event"),
        body.get("data", {}).get("ref"),
        last_error,
    )


def dispatch_to_crm(event: CrmEvent, payload: dict, source: str | None) -> None:
    """Schedules delivery of a listing change. Returns immediately.

    Fire-and-forget: a failure is logged, not raised. If the CRM must never miss
    a change, this needs to become a persisted outbox drained by a worker —
    an in-process task does not survive a redeploy mid-flight.
    """
    if not should_deliver(source):
        return

    body = {"event": event, "data": payload}
    try:
        asyncio.create_task(_post_with_retries(body))
    except RuntimeError:
        # No running loop (e.g. called from sync context in a script/test).
        logger.warning("No event loop available; skipped CRM delivery of %s", event)
