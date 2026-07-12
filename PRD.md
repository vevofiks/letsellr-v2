# PRD — No-Brokerage Property Platform (Letsellr)

**Version:** 2.0 · **Audience:** Developers · **Status:** Build spec

A developer-oriented product requirements document. It reflects the **current** design: a WhatsApp-first, no-brokerage property platform where only owners/agencies have accounts, seekers connect via WhatsApp, and the backend is **FastAPI**.

---

## 1. Overview

Visitors browse genuine, admin-checked properties and contact owners **directly through WhatsApp** — no brokers, no brokerage fee. Only **owners, agencies, and admins** have accounts. Seekers never sign up; their WhatsApp number is their identity.

**Product principles**
- **Free-first:** launch fully free to build trust and inventory; monetization ships *built but off*.
- **Trust by pre-check:** every live listing is admin-approved before publishing, so the site itself is the guarantee (no per-listing "verified" badge shown to visitors).
- **Low friction:** seekers go from browsing to talking to an owner in a few taps, no account.

---

## 2. Architecture

### 2.1 Components
| Layer | Tech | Responsibility |
|---|---|---|
| Public site | **Next.js** | Marketing + property browsing/details. SSR/ISR for SEO. Seeker-facing. |
| Dashboards | **React SPA (Vite)** | Owner/agency dashboard + admin dashboard. Behind login. No SEO needed. |
| Backend API | **FastAPI (Python)** | All business logic, auth, WhatsApp webhook, REST API. |
| Jobs | **Celery + Redis** | Background jobs, cron, follow-ups, owner notifications. |
| Database | **MongoDB** (Motor/Beanie) | All records. *(Postgres + SQLAlchemy is an acceptable alternative.)* |
| Media | **Cloudflare R2** | Photos/files. Free egress. |
| Edge | **Cloudflare CDN** | Fast, safe delivery. |
| Host | **Hetzner** | FastAPI + Celery + Redis on one server (split later). Frontends on Cloudflare Pages / Vercel free tier. |

### 2.2 Request flow
```
Seeker → Next.js (SSR public site) ─┐
Owner/Admin → React SPA ────────────┤→ FastAPI ─┬─ MongoDB
WhatsApp → webhook ─────────────────┘           ├─ Cloudflare R2 (presigned)
                                                 └─ Redis → Celery workers
```

### 2.3 Deployment (initial → scale)
```
Now:     1 Hetzner box = FastAPI (uvicorn/gunicorn) + Celery worker + Redis
Growing: split Celery worker into its own process, then its own box
```
Keep API routers in `/api` and tasks in `/tasks` sharing the same models, so splitting the worker out later is a deploy change, not a rewrite.

---

## 3. User Roles

| Role | Account | Can do |
|---|---|---|
| **Seeker** | ❌ none | Browse, search, enquire via WhatsApp |
| **Owner** | ✅ | Register, list (PG/Hostel), manage own listings |
| **Agency** | ✅ | Same as owner; has a public agency profile |
| **Admin** | ✅ | Verify/approve listings, manage users & plans |

---

## 4. Feature Scope (MVP)

### 4.1 Browsing (public, no login)
Browsing is organized by **transaction intent**, all filtered by **location/place**:
- **Rent** · **Buy** · **Lease** — property listings by intent
- **Agencies** — browse listings grouped by owner/agency

**Property categories (5):** `pg` · `hostel` · `apartment` · `villa_house` · `land`

**Search:** by place/location, by agency, and on a **map**.

### 4.2 Listing restriction ⭐
Owners/agencies can **only create listings in `pg` and `hostel`** categories. The other categories exist for browsing but are **not open for self-listing yet** (seeded/admin-managed or a later phase). Enforced server-side on `POST /properties`.

### 4.3 Enquiry & contact (WhatsApp-first)
- Each property details page has an **Enquire** button → opens a **`wa.me` deep link** to the platform WhatsApp number, pre-filled with the property **reference code**.
- The **WhatsApp bot** replies with the **property location** + **owner phone contact**; seeker and owner then talk **directly**.
- **Free-contact limit:** each WhatsApp number gets **3 free owner contacts** (`FREE_CONTACT_LIMIT`, configurable). Beyond that → paid step (built, switched on in a later phase).

### 4.4 Owner/agency
- Simple registration (basic info) → profile.
- Post listing → **admin review** → goes live.
- Full **CRUD** on own listings.

### 4.5 Admin
- User management, property management (approve/reject/edit/remove), subscription management (later), analytics.

---

## 5. Core Flows

### 5.1 Seeker enquiry (no account)
```
Browse (Rent/Buy/Lease/Agency + location)
  → open details page
  → tap Enquire → wa.me deep link (pre-filled with property ref)
  → WhatsApp bot:
       lookup property by ref
       check seeker's free-contact count (by waNumber)
         ├─ < limit → share location + owner phone, notify owner, log lead
         └─ ≥ limit → paywall message (dormant until monetization on)
  → seeker contacts owner directly → deal closed
```

### 5.2 Owner listing
```
Register (OTP) → create PG/Hostel listing (photos → R2)
  → status: pending_review
  → admin approves → status: live   (rejected → with reason)
  → owner manages via dashboard (edit/update/delete, view stats)
```

### 5.3 Admin verification
```
Review queue → check ownership/photos → approve (live) | reject (reason)
Handle reports → remove listing / ban abusive account
```

---

## 6. Data Models (MongoDB)

> Shown as document shapes. Use Beanie/Motor. `_id` = ObjectId. Index hints noted.

### 6.1 `users` (owners / agencies / admins only)
```python
{
  _id,
  role: "owner" | "agency" | "admin",
  accountType: "individual" | "agency",
  name: str,
  phone: str,            # unique, indexed (login identity)
  phoneVerified: bool,
  email: str | None,
  agencyProfile: {       # only if role == agency
    displayName, about, logoKey, areasServed: [str]
  } | None,
  status: "active" | "suspended",
  createdAt, updatedAt
}
# Indexes: phone (unique), role
```

### 6.2 `properties`
```python
{
  _id,
  ref: str,              # human code e.g. "KL-EKM-0412" (for WhatsApp), indexed
  ownerId: ObjectId,     # ref users, indexed
  title: str,
  category: "pg" | "hostel" | "apartment" | "villa_house" | "land",
  intent: "rent" | "buy" | "lease",   # browse mode
  price: int,
  deposit: int | None,
  location: {
    area: str, city: str, pincode: str,
    geo: { type: "Point", coordinates: [lng, lat] }   # 2dsphere index
  },
  amenities: [str],
  photos: [str],         # R2 object keys
  ownerPhone: str,       # revealed via WhatsApp on enquiry
  status: "draft" | "pending_review" | "live" | "rejected" | "expired" | "inactive",
  review: { reviewedBy: ObjectId, reviewedAt, reason: str | None },
  availability: { confirmedAt, expiresAt },
  stats: { views: int, enquiries: int },
  createdAt, updatedAt
}
# Indexes: ref(unique), ownerId, status, category, intent,
#          location.city, location.geo(2dsphere)
# Rule: category must be in {pg, hostel} on create (server-enforced)
```

### 6.3 `seekers` (lightweight, no auth — free-limit tracking)
```python
{
  _id,
  waNumber: str,         # WhatsApp number, unique indexed = identity
  name: str | None,
  freeContactsUsed: int, # against FREE_CONTACT_LIMIT
  plan: "free" | "paid", # "free" until monetization on
  createdAt
}
# Auto-created on first WhatsApp enquiry. Not an account.
```

### 6.4 `leads` (each WhatsApp enquiry)
```python
{
  _id,
  waNumber: str,         # indexed
  propertyId: ObjectId,  # indexed
  ownerId: ObjectId,
  requirement: { intent, area, budget } | None,
  contactShared: bool,
  waMessageId: str,
  createdAt
}
```

### 6.5 `subscriptions` (created, dormant until monetization phase)
```python
{
  _id, userId, plan: "premium",
  status: "active" | "past_due" | "cancelled",
  provider: "razorpay", razorpaySubId,
  startedAt, expiresAt, createdAt
}
```

### 6.6 `reports`
```python
{
  _id, propertyId, reporterWaNumber: str | None,
  reason: "fake" | "broker" | "unavailable" | "other",
  status: "open" | "actioned" | "dismissed",
  actionedBy, createdAt
}
```

### 6.7 `events` (analytics / funnel)
```python
{
  _id, sessionId: str, waNumber: str | None,
  type: str,             # "listing_viewed", "enquiry_clicked", ...
  props: dict, ts        # indexed: type, ts
}
```

---

## 7. API Endpoints (FastAPI)

> Prefix `/api`. JSON. Auth via JWT in httpOnly cookie (owners/agencies/admin only). Public browse endpoints need no auth.

### 7.1 Auth (owners/agencies/admin)
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/otp/send` | Send OTP over WhatsApp to phone |
| POST | `/auth/otp/verify` | Verify → issue access + refresh cookies |
| POST | `/auth/refresh` | Silent session renewal |
| POST | `/auth/logout` | Clear cookies + revoke refresh |
| GET | `/auth/me` | Current user |

### 7.2 Properties — public browse
| Method | Path | Notes |
|---|---|---|
| GET | `/properties` | Filters: `intent`, `category`, `city`, `q`, `agencyId`, `lat`,`lng`,`radius`, `page` |
| GET | `/properties/{id}` | Details (fires `listing_viewed`) |
| GET | `/properties/{ref}/enquiry-link` | Returns `wa.me` deep link for the Enquire button |

### 7.3 Properties — owner CRUD (auth: owner/agency)
| Method | Path | Notes |
|---|---|---|
| POST | `/properties` | Create — **category must be `pg` or `hostel`** |
| PATCH | `/properties/{id}` | Edit own listing |
| DELETE | `/properties/{id}` | Remove own listing |
| POST | `/properties/{id}/confirm-availability` | "Still available" |
| GET | `/owners/me/properties` | Own listings + stats |

### 7.4 Agencies (public)
| Method | Path | Notes |
|---|---|---|
| GET | `/agencies` | Browse agencies |
| GET | `/agencies/{id}` | Agency profile + its listings |

### 7.5 Owner profile
| Method | Path | Notes |
|---|---|---|
| POST | `/owners/register` | Basic registration |
| GET / PATCH | `/owners/me` | View / edit profile |

### 7.6 WhatsApp
| Method | Path | Notes |
|---|---|---|
| POST | `/webhooks/whatsapp` | Inbound messages → bot logic (parse ref, check limit, share contact, notify owner, log lead) |

### 7.7 Admin (auth: admin)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/properties/queue` | Pending review |
| POST | `/admin/properties/{id}/approve` | → status: live |
| POST | `/admin/properties/{id}/reject` | + reason |
| GET / PATCH | `/admin/users` `/admin/users/{id}` | User management |
| GET | `/admin/reports` | Reports queue |
| GET | `/admin/subscriptions` | (later) |
| GET | `/admin/analytics/funnel` | Funnel + health |

### 7.8 Media / events / subscriptions
| Method | Path | Notes |
|---|---|---|
| POST | `/media/upload-url` | Presigned R2 upload URL |
| POST | `/events` | Batch frontend events |
| POST | `/subscriptions/checkout` | (dormant) Razorpay order |
| POST | `/webhooks/razorpay` | (dormant) payment events |

---

## 8. WhatsApp Integration

- **Provider:** Meta WhatsApp Cloud API, or an India BSP (AiSensy / Interakt / WATI / Gupshup).
- **Pattern:** *user-initiated* (click-to-WhatsApp). The Enquire button is `https://wa.me/<PLATFORM_WA>?text=<encoded: "Interested in <title> (Ref: <ref>)">`. Because the user starts the chat, the 24-hour service window opens and the bot can reply freely.
- **Inbound:** `POST /webhooks/whatsapp` receives the message → parse `ref` → load property → check `seekers.freeContactsUsed` → within limit: reply with location + `ownerPhone`, increment counter, create `lead`, enqueue `notify_owner_enquiry`; over limit: send paywall message (dormant now).
- **Owner notify:** business-initiated → requires an **approved template** + owner opt-in (captured at registration).

---

## 9. Auth & Authorization

- **Identity:** phone number. **OTP delivered over WhatsApp** (reuses the same API; cheaper than SMS).
- **Sessions:** self-issued **JWT** — short-lived **access token** + longer **refresh token**, both in **httpOnly, Secure cookies**. Refresh tokens stored in Redis (revocable). No third-party auth service (free).
- **Recovery:** phone OTP is *both* login and recovery. Optional password (bcrypt) + "forgot → OTP" later.
- **Authorization:** FastAPI dependencies enforce roles, e.g. `Depends(require_role("admin"))`. Owners can only mutate their own properties (ownership check).
- **Only owners/agencies/admins authenticate** — seekers never do.

---

## 10. Background Jobs (Celery + Redis)

| Task | Trigger | Purpose |
|---|---|---|
| `notify_owner_enquiry` | On enquiry | WhatsApp alert to owner |
| `availability_nudge` | Cron (weekly) | Ask owner "still available?" |
| `auto_expire` | Cron | Expire unconfirmed listings |
| `funnel_aggregate` | Cron | Roll up `events` |
| `cleanup` | Cron | Housekeeping |

Structure: `/api` (routers), `/tasks` (Celery), `/models`, `/services` — shared models so the worker can split out later.

---

## 11. Monetization (free-first)

- **Now:** platform fully free. `FREE_CONTACT_LIMIT = 3` per WhatsApp number; the paid step and `subscriptions`/Razorpay code ship **built but disabled**.
- **Later (only if model proven):** flip the limit to metered + enable paid contacts / owner plans. It's a config + toggle, not a rebuild. Price is set from real `events`/`leads` data gathered while free.

---

## 12. Non-Functional

- **SEO:** Next.js SSR/ISR for browse + details pages.
- **Media:** always via R2 + Cloudflare CDN (never through the API host).
- **Search:** `2dsphere` for map/nearby; cache hot queries in Redis.
- **Security:** JWT httpOnly, OTP rate-limiting, ownership checks on mutations, presigned uploads, WhatsApp webhook signature verification.
- **Privacy:** owner phone shared only through the WhatsApp flow; seeker identity is just their WhatsApp number.

---

## 13. Suggested Repo Layout

```
/backend (FastAPI)
  /api        routers (auth, properties, agencies, admin, webhooks, events, media)
  /models     Beanie documents
  /schemas    Pydantic request/response
  /services   business logic (whatsapp, verification, media, funnel)
  /tasks      Celery tasks
  /core       config, security, deps
  main.py     app + uvicorn entry
  worker.py   celery entry
/web-public   Next.js (marketing + browse + details)
/web-app      React SPA (owner/agency + admin dashboards)
/shared       api client, types, design tokens
```

---

## 14. Phased Rollout

| Phase | Ships | Money |
|---|---|---|
| **P1 (MVP)** | Browse (Rent/Buy/Lease/Agency + location), search (place/agency/map), details + Enquire, WhatsApp bot (location + owner contact), 3 free contacts, owner register + PG/Hostel listing, admin review→live, CRUD, event tracking | Free |
| **P2** | Owner dashboard stats, availability cron, reports/moderation | Free |
| **P3 (gate)** | Analyse funnel: is trust + enquiry volume proven? | Decision |
| **P4 (if proven)** | Turn on paid contacts + subscriptions (already built) | Paid |

---

## 15. Open Questions

- Ownership verification: manual admin review at launch, or a KYC API later?
- Who pays when monetization turns on — seekers (per-contact/subscription), owners (featured listings), or both?
- Other categories (apartment/villa/land): admin-seeded, or opened to self-listing in a later phase?
- Postgres vs MongoDB — confirm final choice (this PRD assumes MongoDB; FastAPI supports either).

---

*Current state of truth for the build. Backend = FastAPI (+ Celery/Redis). Public = Next.js (SEO). Dashboards = React SPA. Seekers connect via WhatsApp with no account; owners/agencies list only PG & Hostel; every live listing is admin-checked; the platform launches free with monetization built-but-off.*
