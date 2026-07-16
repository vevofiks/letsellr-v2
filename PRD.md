# PRD — No-Brokerage Property Platform (Letsellr)

**Version:** 3.0 · **Audience:** Developers · **Status:** Build spec

A developer-oriented product requirements document. It reflects the **current** design: a no-brokerage property platform where owners/agencies have verified accounts, seekers enquire via WhatsApp (PG/Hostel) or in-platform manual chat (other categories), and email-based authentication is used for the initial phase.

---

## 1. Overview

Visitors browse genuine, admin-checked properties and contact owners/agencies **directly** — no brokers, no brokerage fee. Only **owners, agencies, and admins** have accounts. Seekers never sign up; they enquire via WhatsApp (PG/Hostel) or in-platform chat (Apartment/Villa/Land/Commercial).

**Product principles**
- **Free-first:** launch fully free to build trust and inventory; monetization ships *built but off*.
- **Trust by verification:** every live listing is admin-approved; every owner/agency profile goes through an admin identity check with a visible **verification badge** on approval.
- **Role-based listing:** owners can list in all categories; agencies are restricted to Apartment, Villa/House, Land, and Commercial.
- **Low friction:** seekers go from browsing to talking to an owner in a few taps, no account needed.

---

## 2. Architecture

### 2.1 Components
| Layer | Tech | Responsibility |
|---|---|---|
| Public site | **Next.js** | Marketing + property browsing/details. SSR/ISR for SEO. Seeker-facing. |
| Dashboards | **React SPA (Vite)** | Owner/agency dashboard + admin dashboard. Behind login. No SEO needed. |
| Backend API | **Node.js / Express** | All business logic, auth, chat, REST API. |
| Auth | **Firebase Auth** or **Supabase Auth** | Email-based authentication for owners/agencies (1-month trial; can swap later). |
| Real-time Chat | **Socket.io** (or Supabase Realtime) | Manual in-platform chat for non-PG/Hostel enquiries. |
| Jobs | **Background workers / cron** | Notifications, availability nudges, cleanup. |
| Database | **MongoDB** | All records. |
| Media | **Cloudflare R2** | Photos/files. Free egress. |
| Edge | **Cloudflare CDN** | Fast, safe delivery. |
| Host | **Hetzner / VPS** | Backend + jobs on one server (split later). Frontends on Cloudflare Pages / Vercel free tier. |

### 2.2 Request flow
```
Seeker     → Next.js (SSR public site) ─┐
Owner/Admin → React SPA ────────────────┤→ Express API ─┬─ MongoDB
                                         │               ├─ Cloudflare R2
Auth flow  → Firebase/Supabase Auth ────┘               └─ Socket.io (chat)
```

### 2.3 Auth provider strategy
- **Trial period (month 1):** Firebase Auth or Supabase Auth handles email sign-up, email verification, and session tokens.
- **Email is the identity** — no phone OTP for login (phone is collected as profile data only).
- **Migration path:** both providers export users; switching is a backend config change, not a rewrite. Keep auth logic in a dedicated `/services/auth` layer.

---

## 3. User Roles

| Role | Account | Can list |
|---|---|---|
| **Seeker / Client** | ❌ none | — |
| **Owner** | ✅ Email auth | PG, Hostel, Apartment, Villa/House, Land, Commercial (all 6) |
| **Agency** | ✅ Email auth | Apartment, Villa/House, Land, Commercial only |
| **Admin** | ✅ Internal | Verify/approve listings & user identities, manage platform |

---

## 4. Feature Scope (MVP)

### 4.1 Browsing (public, no login)
Browsing is organized by **transaction intent**, all filtered by **location/place**:
- **Rent** · **Buy** · **Lease** — property listings by intent
- **Agencies** — browse listings grouped by owner/agency

**Property categories (6):** `pg` · `hostel` · `apartment` · `villa_house` · `land` · `commercial`

**Search:** by place/location, by agency, and on a **map**.

### 4.2 Listing restrictions ⭐
Enforced server-side on `POST /properties`:

| Category | Owner | Agency |
|---|---|---|
| `pg` | ✅ | ❌ |
| `hostel` | ✅ | ❌ |
| `apartment` | ✅ | ✅ |
| `villa_house` | ✅ | ✅ |
| `land` | ✅ | ✅ |
| `commercial` | ✅ | ✅ |

Server must reject an agency attempting to create a `pg` or `hostel` listing with `403 Forbidden`.

### 4.3 Enquiry & contact

#### PG & Hostel → WhatsApp bot
- Enquire button → `wa.me` deep link pre-filled with property reference code.
- WhatsApp bot replies with **property location** + **owner phone contact**.
- Seeker contacts owner directly.
- **Free-contact limit:** 3 free contacts per WhatsApp number (`FREE_CONTACT_LIMIT`, configurable). Beyond that → paid step (built, dormant).

#### Apartment, Villa/House, Land, Commercial → Manual in-platform chat
- Enquire / Chat button → opens an **in-platform chat thread** between the seeker and the agency/owner.
- No WhatsApp bot involvement. Messages are exchanged manually within the platform.
- Chat threads are stored server-side; both parties receive real-time notifications.
- Seeker does **not** need an account — they provide a name + contact at chat initiation.

### 4.4 Registration & Authentication

**Auth provider:** Firebase Auth or Supabase Auth (email-based, 1-month trial).

**Registration flow:**
1. User selects account type: **Owner** or **Agency**.
2. Fills in profile details:
   - Preference type (what they deal in — e.g., residential, commercial)
   - Location (city / area)
   - Phone number
   - Email address
3. Email verification link/OTP is sent by the auth provider.
4. On verification, account is created with status `pending_verification`.
5. Admin reviews and approves identity → account becomes `verified` and badge is shown.

### 4.5 Verification & trust badges
- **Admin-side:** admin reviews each registered owner/agency to confirm genuineness. Can approve or reject with a reason.
- **Client-side badge:** verified owners/agencies display a **Verified Badge** on their profile and listing cards. Badge is removed if admin revokes verification.
- Verification status is independent of listing approval — a user can be verified but have a pending listing, and vice versa.

### 4.6 Admin MVP scope
| Admin area | Key actions |
|---|---|
| **User Management** | View all clients (seekers via chat), owners, agencies. Activate, suspend, delete accounts. |
| **Property Type Management** | Add, edit, or disable property categories shown on the platform. |
| **Verification Requests** | Review pending owner/agency identity requests. Approve → badge granted. Reject → with reason. |
| **Review Management** | Moderate property/agency reviews submitted by users. Approve, hide, or remove. |
| **Subscription Management** | View and manage subscription plans and active subscriptions (built now, enabled later). |
| **Testimonials** | Approve, edit, or remove testimonials shown on the marketing/home pages. |

---

## 5. Core Flows

### 5.1 Seeker enquiry — PG / Hostel (WhatsApp)
```
Browse (Rent/Buy/Lease/Agency + location)
  → open details page (PG or Hostel)
  → tap Enquire → wa.me deep link (pre-filled with property ref)
  → WhatsApp bot:
       lookup property by ref
       check seeker's free-contact count (by waNumber)
         ├─ < limit → share location + owner phone, notify owner, log lead
         └─ ≥ limit → paywall message (dormant until monetization on)
  → seeker contacts owner directly → deal closed
```

### 5.2 Seeker enquiry — Apartment / Villa / Land / Commercial (manual chat)
```
Browse → open details page (Apartment / Villa / Land / Commercial)
  → tap Chat / Enquire
  → seeker provides name + contact info (no account required)
  → in-platform chat thread created between seeker and agency/owner
  → both sides message manually in real time
  → agency shares further details, arranges site visit, closes deal
```

### 5.3 Owner/Agency registration & verification
```
Fill registration form (type, preferences, location, phone, email)
  → email verification sent
  → account created (status: pending_verification)
  → admin reviews identity in Verification Requests queue
    ├─ Approved → status: verified → Verified Badge shown on profile & listings
    └─ Rejected → reason sent to user → can re-submit
```

### 5.4 Owner/Agency listing
```
Login → create listing (within allowed categories)
  → upload photos (→ R2)
  → status: pending_review
  → admin reviews → approve: status: live | reject: with reason
  → owner/agency manages via dashboard (edit/update/delete, view stats)
```

### 5.5 Admin verification flow
```
Verification Requests queue
  → review submitted profile info & documents
  → approve → user.verificationStatus = "verified" → badge shown
  → reject → reason stored, user notified
```

---

## 6. Data Models (MongoDB)

> Shown as document shapes. `_id` = ObjectId. Index hints noted.

### 6.1 `users` (owners / agencies / admins)
```js
{
  _id,
  role: "owner" | "agency" | "admin",
  name: String,
  email: String,            // unique, indexed — primary identity (auth via Firebase/Supabase)
  emailVerified: Boolean,
  phone: String,            // collected at registration, not used for auth
  authProviderUid: String,  // Firebase UID or Supabase UUID
  preferenceType: [String], // e.g. ["residential", "commercial"]
  location: {
    city: String,
    area: String
  },
  agencyProfile: {          // only if role == "agency"
    displayName: String,
    about: String,
    logoKey: String,
    areasServed: [String]
  } | null,
  verificationStatus: "pending" | "verified" | "rejected",
  verificationNote: String | null,   // admin rejection reason
  verifiedAt: Date | null,
  verifiedBy: ObjectId | null,       // admin user _id
  status: "active" | "suspended",
  createdAt, updatedAt
}
// Indexes: email (unique), authProviderUid (unique), role, verificationStatus
```

### 6.2 `properties` (PostgreSQL)
```sql
TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref VARCHAR(50) UNIQUE NOT NULL,

  -- ownership
  owner_id UUID NOT NULL REFERENCES users(id),
  owner_role VARCHAR(20) NOT NULL, -- 'owner' | 'agency'

  -- classification
  category VARCHAR(50) NOT NULL, -- 'pg' | 'hostel' | 'apartment' | 'villa_house' | 'land' | 'commercial'
  intent VARCHAR(20) NOT NULL, -- 'rent' | 'buy' | 'lease'
  enquiry_type VARCHAR(20) NOT NULL, -- 'whatsapp_bot' | 'manual_chat'

  -- details
  title VARCHAR(300) NOT NULL,
  description TEXT,
  area INTEGER, -- sq ft
  bedrooms INTEGER,
  bathrooms INTEGER,
  furnishing VARCHAR(20), -- 'unfurnished' | 'semi' | 'furnished'

  -- pricing
  price INTEGER NOT NULL,
  price_unit VARCHAR(20) NOT NULL DEFAULT 'total', -- 'per_month' | 'total'
  deposit INTEGER,

  -- location
  location_address TEXT,
  location_area VARCHAR(200) NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  location_pincode VARCHAR(20) NOT NULL,
  location_state VARCHAR(100) NOT NULL,
  latitude FLOAT,
  longitude FLOAT,

  -- media (arrays in postgres)
  photos VARCHAR[] NOT NULL DEFAULT '{}',
  amenities VARCHAR[] NOT NULL DEFAULT '{}',

  -- contact
  owner_phone VARCHAR(20) NOT NULL,
  owner_whatsapp VARCHAR(20),

  -- status
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft' | 'pending_review' | 'live' | 'rejected' | 'expired' | 'inactive'
  
  -- admin review
  admin_reviewed_by UUID REFERENCES users(id),
  admin_reviewed_at TIMESTAMPTZ,
  admin_review_reason TEXT,

  -- availability
  availability_confirmed_at TIMESTAMPTZ,
  availability_expires_at TIMESTAMPTZ,

  -- stats
  stats JSONB NOT NULL DEFAULT '{"views": 0, "enquiries": 0, "saves": 0}',

  -- timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: Agency cannot list pg or hostel
  CONSTRAINT agency_category_check CHECK (owner_role != 'agency' OR category NOT IN ('pg', 'hostel'))
);
-- Indexes: ref, owner_id, status, category, intent, location_city
```
```

### 6.3 `chats` (manual enquiry threads — non-PG/Hostel)
```js
{
  _id,
  propertyId: ObjectId,    // indexed
  ownerId: ObjectId,       // indexed
  seeker: {
    name: String,
    contact: String,       // email or phone provided at initiation
    sessionId: String      // anonymous session identifier
  },
  messages: [
    {
      _id,
      sender: "seeker" | "owner",
      text: String,
      sentAt: Date,
      read: Boolean
    }
  ],
  status: "open" | "closed",
  createdAt, updatedAt
}
// Indexes: propertyId, ownerId, createdAt
```

### 6.4 `seekers` (WhatsApp — lightweight, no auth)
```js
{
  _id,
  waNumber: String,        // unique indexed — WhatsApp identity
  name: String | null,
  freeContactsUsed: Number,
  plan: "free" | "paid",
  createdAt
}
// Auto-created on first WhatsApp enquiry (PG/Hostel flow only).
```

### 6.5 `leads` (each WhatsApp enquiry)
```js
{
  _id,
  waNumber: String,        // indexed
  propertyId: ObjectId,    // indexed
  ownerId: ObjectId,
  contactShared: Boolean,
  waMessageId: String,
  createdAt
}
```

### 6.6 `subscriptions`
```js
{
  _id, userId: ObjectId, plan: "premium",
  status: "active" | "past_due" | "cancelled",
  provider: "razorpay", razorpaySubId: String,
  startedAt: Date, expiresAt: Date, createdAt: Date
}
// Built now, dormant until monetization phase.
```

### 6.7 `reviews`
```js
{
  _id,
  targetType: "property" | "agency",
  targetId: ObjectId,
  reviewerName: String,
  rating: Number,          // 1–5
  comment: String,
  status: "pending" | "approved" | "hidden",
  moderatedBy: ObjectId | null,
  createdAt, updatedAt
}
```

### 6.8 `testimonials`
```js
{
  _id,
  name: String,
  role: String,            // e.g. "Property Owner, Kochi"
  content: String,
  photoKey: String | null,
  status: "pending" | "approved" | "hidden",
  displayOrder: Number,
  createdAt, updatedAt
}
```

### 6.9 `reports`
```js
{
  _id, propertyId: ObjectId,
  reporterContact: String | null,
  reason: "fake" | "broker" | "unavailable" | "other",
  status: "open" | "actioned" | "dismissed",
  actionedBy: ObjectId | null, createdAt
}
```

### 6.10 `events` (analytics)
```js
{
  _id, sessionId: String,
  type: String,            // "listing_viewed", "enquiry_clicked", "chat_started", ...
  props: Object, ts: Date
}
```

---

## 7. API Endpoints

> Prefix `/api`. JSON. Auth via JWT/session token from Firebase/Supabase. Public browse endpoints need no auth.

### 7.1 Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Create user after email verification; body: role, name, email, phone, preferenceType, location |
| POST | `/auth/verify-token` | Validate Firebase/Supabase token → issue internal session |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Current user |

### 7.2 Properties — public browse
| Method | Path | Notes |
|---|---|---|
| GET | `/properties` | Filters: `intent`, `category`, `city`, `q`, `agencyId`, `lat`,`lng`,`radius`, `page` |
| GET | `/properties/{id}` | Details (fires `listing_viewed`) |
| GET | `/properties/{ref}/enquiry-link` | Returns `wa.me` deep link (PG/Hostel only) |

### 7.3 Properties — owner/agency CRUD (auth required)
| Method | Path | Notes |
|---|---|---|
| POST | `/properties` | Create — category validated against role |
| PATCH | `/properties/{id}` | Edit own listing |
| DELETE | `/properties/{id}` | Remove own listing |
| GET | `/owners/me/properties` | Own listings + stats |

### 7.4 Agencies (public)
| Method | Path | Notes |
|---|---|---|
| GET | `/agencies` | Browse agencies |
| GET | `/agencies/{id}` | Agency profile + its live listings |

### 7.5 Owner/Agency profile
| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/owners/me` | View / edit profile |
| POST | `/owners/me/verification-request` | Submit identity documents for admin review |

### 7.6 Chat (manual enquiry — non-PG/Hostel)
| Method | Path | Notes |
|---|---|---|
| POST | `/chats` | Start a new chat thread (seeker provides name + contact + propertyId) |
| GET | `/chats/{id}` | Get thread messages |
| POST | `/chats/{id}/messages` | Send a message |
| PATCH | `/chats/{id}/messages/{msgId}/read` | Mark read |
| GET | `/owners/me/chats` | All chat threads for logged-in owner/agency |

> Real-time: Socket.io rooms keyed by `chatId`. Both parties join on open; new messages emit to room.

### 7.7 WhatsApp (PG & Hostel only)
| Method | Path | Notes |
|---|---|---|
| POST | `/webhooks/whatsapp` | Inbound messages → bot logic (parse ref, check limit, share contact, notify owner, log lead) |

### 7.8 Admin (auth: admin role)
| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/admin/users` `/admin/users/{id}` | User management — view, suspend, activate, delete (clients, owners, agencies) |
| GET / POST / PATCH / DELETE | `/admin/property-types` | Manage property category definitions |
| GET | `/admin/verification-requests` | Queue of pending owner/agency identity verifications |
| POST | `/admin/verification-requests/{id}/approve` | Grant verified status + badge |
| POST | `/admin/verification-requests/{id}/reject` | Reject with reason |
| GET | `/admin/properties/queue` | Listing review queue |
| POST | `/admin/properties/{id}/approve` | → status: live |
| POST | `/admin/properties/{id}/reject` | + reason |
| GET / PATCH | `/admin/reviews` `/admin/reviews/{id}` | Review moderation |
| GET | `/admin/subscriptions` | Subscription management |
| GET / PATCH | `/admin/testimonials` `/admin/testimonials/{id}` | Testimonial management |
| GET | `/admin/reports` | Reports queue |
| GET | `/admin/analytics/funnel` | Funnel + health |

### 7.9 Media / events / subscriptions
| Method | Path | Notes |
|---|---|---|
| POST | `/media/upload-url` | Presigned R2 upload URL |
| POST | `/events` | Batch frontend events |
| POST | `/subscriptions/checkout` | (dormant) Razorpay order |
| POST | `/webhooks/razorpay` | (dormant) payment events |

---

## 8. WhatsApp Integration (PG & Hostel only)

- **Applies to:** `pg` and `hostel` categories exclusively.
- **Provider:** Meta WhatsApp Cloud API, or India BSP (AiSensy / Interakt / WATI / Gupshup).
- **Pattern:** *user-initiated* click-to-WhatsApp. Enquire button = `https://wa.me/<PLATFORM_WA>?text=<encoded ref>`.
- **Inbound:** `POST /webhooks/whatsapp` → parse ref → load property → check `seekers.freeContactsUsed` → within limit: reply with location + `ownerPhone`, increment counter, create lead, enqueue owner notification; over limit: send paywall message (dormant).
- **Owner notify:** business-initiated template + owner opt-in at registration.

---

## 9. In-Platform Chat (Apartment, Villa/House, Land, Commercial)

- **Applies to:** all non-PG/Hostel categories.
- Seeker taps **Chat / Enquire** → fills in name + contact → thread created.
- Messages stored in `chats` collection.
- Real-time delivery via **Socket.io** (or Supabase Realtime if using Supabase Auth).
- Owner/agency receives **email or push notification** when a new message arrives.
- No WhatsApp bot involvement in this flow.

---

## 10. Auth & Authorization

- **Provider:** Firebase Auth or Supabase Auth (email-based, trial period).
- **Identity:** email address. Email verification is mandatory before profile creation.
- **Session:** auth provider issues a JWT/token; backend validates it on each request via SDK or public keys.
- **Phone:** collected as a profile field, not used for authentication.
- **Authorization:** middleware enforces roles. Owners/agencies can only mutate their own properties. Category listing rules enforced server-side.
- **Only owners/agencies/admins authenticate** — seekers never do.
- **Migration path:** auth logic isolated in `/services/auth`; switching providers is a config change.

---

## 11. Background Jobs

| Task | Trigger | Purpose |
|---|---|---|
| `notify_owner_enquiry` | On WhatsApp enquiry | WhatsApp alert to owner (PG/Hostel) |
| `notify_owner_chat` | On new chat message | Email/push alert to owner (other categories) |
| `availability_nudge` | Cron (weekly) | Ask owner "still available?" |
| `auto_expire` | Cron | Expire unconfirmed listings |
| `cleanup` | Cron | Housekeeping |

---

## 12. Monetization (free-first)

- **Now:** platform fully free. `FREE_CONTACT_LIMIT = 3` per WhatsApp number (PG/Hostel). Chat enquiries unlimited for now.
- **Later (only if model proven):** enable paid contacts / owner plans. Config + toggle, not a rebuild.

---

## 13. Non-Functional

- **SEO:** Next.js SSR/ISR for browse + details pages.
- **Media:** always via R2 + Cloudflare CDN.
- **Search:** `2dsphere` for map/nearby; cache hot queries in Redis.
- **Security:** JWT/token validation, rate-limiting on auth, ownership checks on mutations, presigned uploads, WhatsApp webhook signature verification.
- **Privacy:** owner phone shared only through WhatsApp bot (PG/Hostel); chat threads keep seeker anonymous until they choose to share contact.

---

## 14. Suggested Repo Layout

```
/backend (Node.js / Express)
  /routes       auth, properties, agencies, admin, chat, webhooks, media, events
  /models       Mongoose schemas
  /services     auth (Firebase/Supabase adapter), whatsapp, chat, verification, media
  /middleware   requireAuth, requireRole, requireOwnership
  /jobs         background tasks / cron
  /core         config, socket setup
  app.js        Express app entry
/web-public     Next.js (marketing + browse + details)
/web-app        React SPA (owner/agency + admin dashboards)
/shared         api client, types, design tokens
```

---

## 15. Phased Rollout

| Phase | Ships | Money |
|---|---|---|
| **P1 (MVP)** | Browse (6 categories, Rent/Buy/Lease/Agency + location), search (place/agency/map), details + Enquire, WhatsApp bot (PG/Hostel), manual chat (other categories), email auth (Firebase/Supabase), owner register (all 6 categories) + agency register (4 categories), admin verification queue (listings + users), verification badge, admin MVP panels (user mgmt, property types, verification, reviews, subscriptions, testimonials), CRUD | Free |
| **P2** | Owner dashboard stats, availability cron, reports/moderation, chat notifications | Free |
| **P3 (gate)** | Analyse funnel: is trust + enquiry volume proven? | Decision |
| **P4 (if proven)** | Turn on paid contacts + subscriptions (already built) | Paid |

---

## 16. Open Questions

- Auth provider final choice: Firebase Auth vs Supabase Auth — decide before P1 build starts (Supabase has an advantage if using Supabase Realtime for chat).
- KYC API for automated verification later, or keep admin-manual indefinitely?
- Chat storage: keep in MongoDB `chats` collection, or use Supabase tables if on Supabase?
- Who pays when monetization turns on — seekers (per-contact/subscription), owners (featured listings), or both?

---

*Current state of truth for the build. Backend = Node.js/Express. Auth = Firebase/Supabase (email, trial). Public = Next.js (SEO). Dashboards = React SPA. Owners list all 6 categories; agencies list Apartment/Villa/Land/Commercial only. PG & Hostel enquiries via WhatsApp bot; all other enquiries via manual in-platform chat. Every live listing is admin-checked; every owner/agency identity is admin-verified with a visible badge. Platform launches free with monetization built-but-off.*
