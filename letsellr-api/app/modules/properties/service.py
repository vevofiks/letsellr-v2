import asyncio
import math
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.core.whatsapp import notify_admin_pending_property
from app.modules.admin.service import admin_alert_targets

from fastapi import HTTPException, status
from sqlalchemy import asc, desc

from app.db.session import AsyncSession
from app.modules.properties.refs import current_period, format_ref, period_key
from app.modules.webhooks.outbound import build_property_payload, dispatch_to_crm
from app.modules.webhooks.revucrm import dispatch_revucrm_property_webhook
from app.modules.properties.slugs import build_property_slug, looks_like_slug
from app.modules.properties.models import (
    Property,
    AGENCY_ALLOWED_CATEGORIES,
    OWNER_ALLOWED_CATEGORIES,
)
from app.modules.properties.repository import PropertyRepository
from app.modules.properties.schemas import (
    PropertyBrowseResponse,
    PropertyCreate,
    PropertyResponse,
    PropertyUpdate,
    EnquiryLinkResponse,
    NearbyLocationsResponse,
    LocationSuggestion,
)
from app.modules.users.models import User
import urllib.parse


class PropertyService:
    def __init__(self, db: AsyncSession):
        self.repo = PropertyRepository(db)

    async def _generate_ref(self) -> str:
        """Next reference code for the current month, e.g. LSR26-080001.

        The month is taken in the business timezone rather than the server's,
        and the sequence is claimed atomically, so two listings submitted at the
        same instant cannot receive the same code.
        """
        year, month = current_period()
        sequence = await self.repo.claim_ref_sequence(period_key(year, month))
        return format_ref(year, month, sequence)

    async def create_property(
        self,
        data: PropertyCreate,
        current_user: User,
        owner_user: Optional[User] = None,
        source: str = "web",
        external_id: Optional[str] = None,
    ) -> Property:
        """
        Creates a listing attributed to `owner_user` (defaults to `current_user`).
        Admin-created listings pass a different `owner_user` — the one who'll own
        the listing — so category restrictions are enforced against *their* role,
        not the admin's.
        """
        owner_user = owner_user or current_user

        if (
            owner_user.role in ("owner", "agency")
            and owner_user.verification_status != "verified"
            and current_user.role != "admin"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending admin verification. You'll be able to list properties once it's approved.",
            )

        # Only Owners can post PG/Hostels, Agencies can post everything else
        if owner_user.role == "owner" and data.category not in OWNER_ALLOWED_CATEGORIES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Individual owners cannot list in category: {data.category}",
            )
        if (
            owner_user.role == "agency"
            and data.category not in AGENCY_ALLOWED_CATEGORIES
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Agencies cannot list in category: {data.category}",
            )

        enquiry_type = (
            "whatsapp_bot"
            if data.category in ["pg", "hostel", "pg_hostel"]
            else "manual_chat"
        )
        ref = await self._generate_ref()

        location_data = data.location.model_dump()
        property_dict = data.model_dump(
            exclude={"location", "listing_party", "owner_id"}
        )
        property_dict.update(
            {
                "owner_id": owner_user.id,
                "owner_role": owner_user.role,
                "ref": ref,
                "slug": build_property_slug(
                    title=property_dict.get("title", ""),
                    location_area=location_data.get("area"),
                    location_city=location_data.get("city"),
                    ref=ref,
                ),
                "enquiry_type": enquiry_type,
                "location_address": location_data.get("address"),
                "location_area": location_data.get("area"),
                "location_city": location_data.get("city"),
                "location_pincode": location_data.get("pincode"),
                "location_state": location_data.get("state"),
                "latitude": location_data.get("latitude"),
                "longitude": location_data.get("longitude"),
                "status": data.status or "pending_review",
                "stats": {"views": 0, "enquiries": 0, "saves": 0},
                "source": source,
                "external_id": external_id,
            }
        )

        created = await self.repo.create(property_dict)

        # Mirror the new listing into the CRM. Skipped for listings the CRM
        # itself just sent us, otherwise the two systems bounce it forever.
        dispatch_to_crm(
            "property.created", build_property_payload(created), created.source
        )

        # Owner/agency listings can never be created as "live" (see
        # PropertyCreate.status), so this only fires for admin direct
        # listings published immediately — review-queued listings are
        # pushed later, once approved (see admin_router.approve_property).
        if created.status == "live":
            dispatch_revucrm_property_webhook(created)

        # Alert admins on WhatsApp when a listing lands in the review queue.
        # Admin-created listings are skipped — the admin is already in the panel.
        if created.status == "pending_review" and current_user.role != "admin":
            targets = await admin_alert_targets(self.repo.db, "properties")
            if targets:
                # Snapshot the fields now — the task outlives this DB session.
                alert = {
                    "title": created.title,
                    "ref": created.ref,
                    "category": created.category,
                    "city": created.location_city,
                    "owner_name": owner_user.name,
                    "owner_role": owner_user.role,
                    "recipients": targets,
                }
                asyncio.create_task(notify_admin_pending_property(**alert))

        return created

    async def update_property(
        self, property_id: str | uuid.UUID, data: PropertyUpdate, current_user: User
    ) -> Property:
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        if prop.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=403, detail="Not authorized to edit this property"
            )

        old_photos = list(prop.photos or [])
        update_data = data.model_dump(exclude_unset=True)
        if "location" in update_data:
            loc = update_data.pop("location")
            if "address" in loc:
                update_data["location_address"] = loc["address"]
            if "area" in loc:
                update_data["location_area"] = loc["area"]
            if "city" in loc:
                update_data["location_city"] = loc["city"]
            if "pincode" in loc:
                update_data["location_pincode"] = loc["pincode"]
            if "state" in loc:
                update_data["location_state"] = loc["state"]
            if "latitude" in loc:
                update_data["latitude"] = loc["latitude"]
            if "longitude" in loc:
                update_data["longitude"] = loc["longitude"]

        updated = await self.repo.update(prop, update_data)

        dispatch_to_crm(
            "property.updated", build_property_payload(updated), updated.source
        )

        if "photos" in update_data:
            removed = [
                url for url in old_photos if url not in set(update_data["photos"])
            ]
            if removed:
                from app.modules.media.service import MediaService

                await MediaService().delete_files_by_url(removed)

        return updated

    async def delete_property(
        self, property_id: str | uuid.UUID, current_user: User
    ) -> None:
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        if prop.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=403, detail="Not authorized to delete this property"
            )

        photos = list(prop.photos or [])
        # Snapshot before deletion — the payload cannot be built from a row
        # that no longer exists.
        deleted_payload = build_property_payload(prop)
        deleted_source = prop.source
        await self.repo.delete(prop)

        dispatch_to_crm("property.deleted", deleted_payload, deleted_source)

        if photos:
            from app.modules.media.service import MediaService

            await MediaService().delete_files_by_url(photos)

    async def get_property(self, property_id: str | uuid.UUID) -> Property:
        prop = None
        # Attempt UUID lookup first if property_id is valid UUID format or UUID object
        if isinstance(property_id, uuid.UUID):
            prop = await self.repo.get_by_id(property_id)
        else:
            str_val = str(property_id).strip()

            # Slugs are the canonical public identifier, so they are tried
            # first. looks_like_slug rules out UUIDs and PROP- refs, so those
            # paths still resolve in a single query.
            if looks_like_slug(str_val):
                prop = await self.repo.get_by_slug(str_val)

            if not prop:
                try:
                    parsed_uuid = uuid.UUID(str_val)
                    prop = await self.repo.get_by_id(parsed_uuid)
                except ValueError:
                    # Not a UUID, look up by property reference code
                    # (e.g. PROP-AB12CD, PG1042)
                    prop = await self.repo.get_by_ref(str_val)

            if not prop:
                # Fallback: if search by UUID yielded nothing, try search by ref code
                prop = await self.repo.get_by_ref(str_val)

        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        return prop

    async def record_property_view(
        self,
        property_id: str | uuid.UUID,
        current_user_id: Optional[uuid.UUID] = None,
        visitor_token: Optional[str] = None,
    ) -> Property:
        """
        Increments property view count by 1 for unique users / visitor tokens.
        """
        prop = await self.get_property(property_id)
        viewer_key = None
        if current_user_id:
            viewer_key = f"usr_{current_user_id}"
        elif visitor_token and visitor_token.strip():
            viewer_key = f"vis_{visitor_token.strip()}"

        current_stats = dict(prop.stats or {})
        viewed_by = list(current_stats.get("viewed_by", []))
        legacy_viewed = current_stats.get("viewed_by_users", [])

        if (
            viewer_key
            and viewer_key not in viewed_by
            and (not current_user_id or str(current_user_id) not in legacy_viewed)
        ):
            viewed_by.append(viewer_key)
            current_stats["viewed_by"] = viewed_by
            current_stats["views"] = current_stats.get("views", 0) + 1
            await self.repo.update(prop, {"stats": current_stats})

        return prop

    async def get_enquiry_link(
        self,
        ref: str,
        current_user_id: Optional[uuid.UUID] = None,
        visitor_token: Optional[str] = None,
    ) -> EnquiryLinkResponse:
        """
        Resolve a property ref to a WhatsApp wa.me deep-link.

        Increments the property's enquiry/leads stat counter by exactly 1 per unique user/visitor.
        """
        prop = await self.repo.get_by_ref(ref)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        category_lower = (prop.category or "").lower()
        is_pg_or_hostel = category_lower in ["pg", "hostel", "pg_hostel"]

        bot_num = (
            getattr(settings, "WHATSAPP_BOT_NUMBER", "918137090018")
            .replace("+", "")
            .replace(" ", "")
            .replace("-", "")
        )
        sales_num = (
            getattr(settings, "WHATSAPP_SALES_NUMBER", "918137090018")
            .replace("+", "")
            .replace(" ", "")
            .replace("-", "")
        )

        phone = bot_num if is_pg_or_hostel else sales_num

        message = (
            f"Hi, I found your listing on Letsellr (Ref: {ref}) "
            f"and I'm interested. Is it still available?"
        )
        wa_link = f"https://wa.me/{phone}?text={urllib.parse.quote(message)}"

        enquirer_key = None
        if current_user_id:
            enquirer_key = f"usr_{current_user_id}"
        elif visitor_token and visitor_token.strip():
            enquirer_key = f"vis_{visitor_token.strip()}"

        current_stats = dict(prop.stats or {})
        enquired_by = list(current_stats.get("enquired_by", []))

        if enquirer_key and enquirer_key not in enquired_by:
            enquired_by.append(enquirer_key)
            current_stats["enquired_by"] = enquired_by
            current_stats["enquiries"] = current_stats.get("enquiries", 0) + 1
            await self.repo.update(prop, {"stats": current_stats})

        enquiry_type = "whatsapp_bot" if is_pg_or_hostel else "manual_chat"

        return EnquiryLinkResponse(
            ref=ref,
            link=wa_link,
            enquiry_type=enquiry_type,
            is_pg_or_hostel=is_pg_or_hostel,
        )

    async def list_public_properties(
        self,
        intent: Optional[str] = None,
        category: Optional[str] = None,
        city: Optional[str] = None,
        q: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        sort_by: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[float] = 20.0,
        gender_preference: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PropertyBrowseResponse:
        filters: Dict[str, Any] = {}
        if intent:
            filters["intent"] = intent
        if category:
            filters["category"] = category
        if city:
            filters["city"] = city
        if q:
            filters["q"] = q
        if owner_id:
            filters["owner_id"] = owner_id
        if min_price is not None:
            filters["min_price"] = min_price
        if max_price is not None:
            filters["max_price"] = max_price
        if gender_preference:
            filters["gender_preference"] = gender_preference

        offset = (page - 1) * limit
        items, total = await self.repo.list_public(
            filters=filters,
            limit=limit,
            offset=offset,
            lat=lat,
            lng=lng,
            radius=radius,
            sort_by=sort_by,
        )

        total_pages = math.ceil(total / limit) if limit else 0

        return PropertyBrowseResponse(
            results=items,
            total=total,
            page=page,
            page_size=limit,
            total_pages=total_pages,
        )

    async def list_owner_properties(self, owner_id: uuid.UUID) -> List[Property]:
        return await self.repo.list_by_owner(owner_id)

    async def get_nearby_locations(
        self, lat: float, lng: float, radius: float | int = 5000
    ) -> NearbyLocationsResponse:
        # Normalize radius: if radius >= 100 treat as meters, else treat as kilometers
        radius_km = float(radius) / 1000.0 if radius >= 100 else float(radius)
        if radius_km <= 0:
            radius_km = 5.0

        # Query live properties with lat & lng within preferred radius
        db_props = await self.repo.get_properties_near_location(
            lat=lat, lng=lng, radius_km=radius_km, limit=50
        )

        suggestions: list[LocationSuggestion] = []
        for prop in db_props:
            photo_url = prop.photos[0] if prop.photos and len(prop.photos) > 0 else None
            addr = (
                prop.location_address or f"{prop.location_area}, {prop.location_city}"
            )
            suggestions.append(
                LocationSuggestion(
                    name=prop.title,
                    address=addr,
                    latitude=prop.latitude or 0.0,
                    longitude=prop.longitude or 0.0,
                    types=[prop.category, prop.intent],
                    property_id=prop.id,
                    price=prop.price,
                    category=prop.category,
                    intent=prop.intent,
                    photo=photo_url,
                )
            )

        # Optionally query Geoapify API if key is present
        if getattr(settings, "PLACES_API_KEY", None):
            try:
                url = "https://api.geoapify.com/v2/places"
                params = {
                    "categories": "commercial,building,accommodation",
                    "filter": f"circle:{lng},{lat},{int(radius_km * 1000)}",
                    "limit": 5,
                    "apiKey": settings.PLACES_API_KEY,
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        features = data.get("features", [])
                        for feature in features:
                            props = feature.get("properties", {})
                            suggestions.append(
                                LocationSuggestion(
                                    name=props.get("name")
                                    or props.get("street")
                                    or "Unknown Place",
                                    address=props.get("formatted"),
                                    latitude=props.get("lat", 0.0),
                                    longitude=props.get("lon", 0.0),
                                    types=props.get("categories", []),
                                )
                            )
            except Exception as e:
                print(f"Geoapify Error: {e}")

        return NearbyLocationsResponse(results=suggestions)

    async def report_property(
        self,
        property_id: uuid.UUID,
        reason: str,
        description: Optional[str],
        reporter_phone: Optional[str],
        reporter_ip: Optional[str],
        user_id: Optional[uuid.UUID],
    ):
        prop = await self.repo.get_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        from app.modules.properties.models import PropertyReport
        from sqlalchemy import func, select as sa_select

        # Silent IP rate-limit: max 3 reports/hour. Exceeding it drops the
        # report without telling the caller, so spammers see the same
        # success response as everyone else.
        if reporter_ip:
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            count_stmt = sa_select(func.count()).select_from(PropertyReport).where(
                PropertyReport.reporter_ip == reporter_ip,
                PropertyReport.created_at >= one_hour_ago,
            )
            recent_count = (await self.repo.db.execute(count_stmt)).scalar_one()
            if recent_count >= 3:
                return None

        report = PropertyReport(
            property_id=property_id,
            property_ref=prop.ref,
            reporter_id=user_id,
            reason=reason,
            description=description,
            reporter_phone=reporter_phone,
            reporter_ip=reporter_ip,
            status="pending",
        )
        self.repo.db.add(report)
        await self.repo.db.commit()
        await self.repo.db.refresh(report)
        return report
