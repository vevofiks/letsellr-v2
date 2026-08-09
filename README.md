# Letsellr — No-Brokerage Property Platform

A verified property marketplace for Kerala where owners and agencies list directly, and seekers connect with them without brokers or brokerage fees.

---

## What this is

Letsellr connects property seekers directly with verified owners and agencies. No brokers. No brokerage fee. Seekers browse freely, enquire through WhatsApp, and contact owners directly. Owners and agencies get a free listing page and receive qualified enquiries straight to their WhatsApp.

---

## How it works

**For seekers**
- Browse properties by Rent, Buy, or Lease — filtered by location
- Search by place, agency, or on a map
- Tap Enquire on any listing → opens WhatsApp → get owner contact directly
- Free to use — first 3 owner contacts are free
- After the limit, contact the sales team to continue

**For owners and agencies**
- Register with basic details — free
- Post a listing → admin reviews → goes live
- Receive enquiries directly on WhatsApp
- Manage listings (add, edit, delete) from the dashboard
- Get verified by admin to build seeker trust

**For admin**
- Review and approve new listings before they go live
- Verify owner and agency profiles
- Manage users, property types, locations, and subscriptions
- Handle reports and reviews

---

## Property categories

| Category | Who can list |
|---|---|
| PG | Owner |
| Hostel | Owner |
| Apartment | Agency |
| Villa / House | Agency |
| Land | Agency |
| Commercial | Agency |

---

## Tech stack

| Layer | Tech |
|---|---|
| Public site | Next.js (marketing + browse + property details) |
| Dashboards | React + Vite (owner/agency + admin) |
| Backend API | FastAPI (Python) |
| Background jobs | Celery + Redis |
| Database | PostgreSQL + Alembic (migrations) |
| Media storage | Cloudflare R2 (photos and files) |
| Auth | Firebase Auth (email OTP) |
| Maps | Google Maps API (location + nearby search) |
| Enquiry | WhatsApp (click-to-chat via wa.me deep link) |
| CDN | Cloudflare |
| Server | Hetzner Cloud |

---

## Project structure

```
/
├── backend/                  FastAPI backend
│   ├── app/
│   │   ├── core/             config, database, auth, dependencies
│   │   ├── modules/
│   │   │   ├── admin/        admin submodules (dashboard, reviews, etc.)
│   │   │   ├── properties/   listing CRUD + search
│   │   │   ├── users/        owner and agency accounts
│   │   │   ├── seekers/      seeker accounts + msg limit
│   │   │   ├── leads/        captured lead storage
│   │   │   ├── locations/    states, cities, areas
│   │   │   ├── webhooks/     WhatsApp webhook handler
│   │   │   └── media/        R2 presigned upload URLs
│   │   ├── main.py           FastAPI app entry point
│   │   └── worker.py         Celery worker entry point
│   └── alembic/              database migrations
│
├── web-public/               Next.js — public marketing + browse site
│   ├── pages/
│   │   ├── index             home / landing
│   │   ├── browse/           rent, buy, lease, agencies
│   │   ├── property/[id]     property detail + enquire
│   │   ├── agency/[id]       agency public profile
│   │   └── search            search results + map view
│   └── components/
│       └── LeadCaptureBar    sticky phone capture bar (bottom of page)
│
└── web-app/                  React SPA — owner/agency + admin dashboards
    └── src/
        ├── pages/
        │   ├── owner/        dashboard, listings, post property, profile
        │   ├── seeker/       saved properties, enquiries, profile
        │   └── admin/        all admin pages
        └── components/
```

---

## Pages by role

### Public (no login needed)
- Home / landing page
- Browse — Rent / Buy / Lease / Agencies
- Search results + map view
- Property detail page
- Agency public profile
- Login / Register

### Seeker (logged in)
- Home feed with enquiry count
- My enquiries
- Saved properties
- Profile and settings

### Owner / Agency (logged in)
- Dashboard — listing stats and recent enquiries
- My properties — all listings with status
- Post / edit a property
- Enquiries received
- Profile and verification request

### Admin
- Dashboard — pending counts and platform stats
- Property review queue — approve or reject listings
- User management — seekers, owners, agencies
- Verification requests — approve profile badges
- Limit overrides — bump seeker contact limit after payment
- Reports and flags
- Property types — manage categories
- Locations — states, cities, areas
- Review management
- Testimonials
- Subscription management

---

## Enquiry flow

```
Seeker opens property detail page
  → taps Enquire button
  → WhatsApp opens with pre-filled message including property ref code
  → platform WhatsApp receives the message
  → bot checks seeker's msg_usage vs msg_limit
      ├── within limit → replies with location + owner phone contact
      │                  logs the lead, notifies owner, increments usage
      └── limit reached → replies "Contact our team to continue"
                          admin sees it in the leads list and calls manually
```

---

## Lead capture (no registration needed)

Visitors who leave without enquiring can drop their phone number in a single-field bar at the bottom of every public page. No form, no email, no registration. The admin team calls them manually. No WhatsApp API cost involved.

---

## Msg limit system

| Field | Description |
|---|---|
| `msg_limit` | Max contacts allowed — set by admin (default: 3) |
| `msg_usage` | How many contacts used — incremented by webhook |

When `msg_usage >= msg_limit` the seeker sees a prompt to contact the sales team. Admin manually bumps the limit after payment confirmation. Razorpay integration is built but switched off until the free period ends.

---

## Verification badge

The verified badge on an owner or agency profile is set **only by admin** after reviewing submitted documents. It is never self-set by the user. The badge appears on their public profile and all their listing cards once approved.

---

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis
- A Cloudflare account (R2 bucket)
- A Firebase project (auth)
- A Google Maps API key
- A Hetzner server (or any Linux VPS)

### Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your values
alembic upgrade head        # run all migrations
uvicorn app.main:app --reload
```

### Run the Celery worker
```bash
cd backend
celery -A app.worker worker --loglevel=info
```

### Public site (Next.js)
```bash
cd web-public
npm install
cp .env.local.example .env.local   # fill in API URL + Google Maps key
npm run dev
```

### Dashboard app (React)
```bash
cd web-app
npm install
cp .env.example .env
npm run dev
```

---

## Environment variables

### Backend `.env`
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/letsellr
REDIS_URL=redis://localhost:6379/0
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/key.json
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
PLATFORM_WA_NUMBER=91XXXXXXXXXX
FREE_MSG_LIMIT=3
GOOGLE_MAPS_API_KEY=
```

### Next.js `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
NEXT_PUBLIC_WA_NUMBER=91XXXXXXXXXX
```

---

## Deployment

| Service | Host |
|---|---|
| FastAPI + Celery + Redis | Hetzner CX33 (€8.99/mo) |
| Next.js public site | Cloudflare Pages (free) |
| React dashboard | Cloudflare Pages (free) |
| PostgreSQL | Managed or self-hosted on the same Hetzner box |
| Media / photos | Cloudflare R2 (~₹0–500/mo) |
| CDN + proxy | Cloudflare free plan |

**Estimated monthly cost at launch:** ₹800 – 1,500

---

## Phased rollout

| Phase | What ships |
|---|---|
| P1 — MVP | Browse, search, map, property detail, WhatsApp enquiry, owner listing (PG/Hostel), agency listing, admin review, lead capture bar |
| P2 | Owner dashboard stats, freshness cron, report/moderation, verification flow |
| P3 | Seeker saved properties, reviews, testimonials, agency portfolio |
| P4 | Paid contacts — flip `msg_limit` to metered and enable Razorpay (only after P1–P3 data confirms demand) |

---

## Contributing

This is a private project. Internal team use only.

---

*Kerala's no-brokerage property platform — connecting owners and seekers directly.*
