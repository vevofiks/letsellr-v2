# How the Platform Works

> A no-brokerage property platform — visitors find genuine, verified properties directly from owners and agencies, and connect to close the deal themselves. No brokers. No brokerage fee.

---

## Who uses it

| User | What they do | Account needed? |
|---|---|---|
| **Visitor (seeker / client)** | Browses, searches, enquires | ❌ No — connects via WhatsApp (PG/Hostel) or manual chat (other types) |
| **Owner** | Registers, posts listings in **any category**, gets verified | ✅ Yes |
| **Agency** | Registers, posts listings in **Apartment, Villa/House, Land, Commercial**, gets verified | ✅ Yes |
| **Admin** | Verifies users & listings, manages platform | ✅ Yes |

---

## 1. Browsing — how visitors find properties

Visitors don't need to sign up. Everything is browsed **based on location / place**, under four simple modes:

- 🏠 **Rent** — properties available to rent
- 💰 **Buy** — properties for sale
- 📄 **Lease** — properties available on lease
- 🏢 **Agencies** — browse by a specific owner or agency

Within these, properties fall into **6 types:**

`PG` · `Hostel` · `Apartment` · `Villa / House` · `Land` · `Commercial`

**Extra ways to search:**

- **By place** — search a specific area or town
- **By agency** — see all listings from one owner/agency
- **On the map** — browse properties visually by location

---

## 2. Listing rules — who can post what

| Category | Owner | Agency |
|---|---|---|
| **PG** | ✅ Can list | ❌ Cannot list |
| **Hostel** | ✅ Can list | ❌ Cannot list |
| **Apartment** | ✅ Can list | ✅ Can list |
| **Villa / House** | ✅ Can list | ✅ Can list |
| **Land** | ✅ Can list | ✅ Can list |
| **Commercial** | ✅ Can list | ✅ Can list |

> **Rule:** Agencies are restricted to professional property categories (Apartment, Villa/House, Land, Commercial). PG and Hostel are owner-only categories. This is enforced server-side.

---

## 3. The visitor journey (finding → enquiring → closing)

The enquiry method depends on the **property category**:

### PG & Hostel → WhatsApp Bot
1. Visitor browses and opens a property's **details page**.
2. Taps the **Enquire** button.
3. Opens the **WhatsApp bot**, which replies with the **property location** and the **owner's phone contact**.
4. Visitor contacts the owner directly and closes the deal — no middleman.

### Apartment, Villa/House, Land, Commercial → Manual Chat
1. Visitor browses and opens a property's **details page**.
2. Taps the **Enquire / Chat** button.
3. Opens an **in-platform chat** directly with the agency or owner.
4. Both sides exchange messages manually within the platform.
5. Deal is negotiated and closed directly.

> **Free-contact limit:** each visitor gets **3 free owner contacts** to start. After that, further contacts become a paid step (switched on later, once the platform is established).

---

## 4. Registration & Authentication

Registration is **email-based** (via Firebase Auth or Supabase Auth for the initial trial period).

**Sign-up fields:**
- User type: **Owner** or **Agency**
- Preference type (what they deal in)
- Location (city / area)
- Phone number
- Email address

Authentication flow:
1. User enters email → receives a verification/magic link or OTP to email.
2. After email verification, profile setup is complete.
3. Account is pending **admin verification** until approved.

---

## 5. Owners & Agencies (listing properties)

The supply side — the only users who register.

1. **Simple registration** with the fields above creates an owner/agency profile.
2. From the dashboard, they get a **listing option** to post a property.
3. The listing goes to the **admin for verification** — not public yet.
4. Once approved, it's **officially listed** on the website.
5. Owners/agencies can **edit, update, or delete** their listings any time (full CRUD control).

---

## 6. Verification & Trust Badges

### Admin-side verification
- Admin reviews each registered **owner** and **agency** to confirm they are genuine.
- Admin can approve or reject a verification request with a reason.
- This is separate from property listing approval.

### Client-side verification badge
- Once an owner/agency is verified by admin, their **profile** and **listings** display a **Verified Badge** (✅ or equivalent).
- Seekers/clients can see at a glance whether they are dealing with a verified party.
- Unverified accounts can still list (pending approval flow), but the badge is only shown after admin confirms genuineness.

---

## 7. Admin side (MVP)

The control room that keeps the platform genuine and running.

| Admin area | What it does |
|---|---|
| **User Management** | View and manage clients (seekers), owners, and agencies — suspend, activate, or remove accounts |
| **Property Type Management** | Define and manage the available property categories/types on the platform |
| **Verification Requests** | Review and approve/reject owner & agency identity/genuineness checks; grant or revoke the verification badge |
| **Review Management** | Moderate user-submitted reviews and ratings for properties or agencies |
| **Subscription Management** | Manage plans, paid features, and billing (built now, enabled later) |
| **Testimonials** | Approve and manage testimonials displayed on the platform's marketing pages |

---

## The whole flow at a glance

```
Owner/Agency registers (email auth)
   → admin verifies identity → verification badge granted
      → posts a listing (category per role rules)
         → admin reviews listing → listing goes live
            → visitor browses by Rent / Buy / Lease / Agency + location
               → opens details → taps Enquire
                  ├─ PG / Hostel → WhatsApp bot shares location + owner contact
                  └─ Apartment / Villa / Land / Commercial → manual in-platform chat
                     → visitor & owner/agency talk directly
                        → deal closed  ✅
```

---

## MVP feature checklist

| Feature | In MVP? |
|---|---|
| Browse by **Rent, Buy, Lease, Agencies** (by location) | ✅ |
| 6 property types (PG, Hostel, Apartment, Villa/House, Land, Commercial) | ✅ |
| Search by place, by agency, and on map | ✅ |
| Property details page + Enquire button | ✅ |
| WhatsApp bot → location + owner contact (PG & Hostel only) | ✅ |
| Manual in-platform chat for Apartment, Villa/House, Land, Commercial | ✅ |
| Direct owner/agency contact (no broker) | ✅ |
| 3 free contacts, then paid (later) | ✅ |
| **Owner** registration — lists in **all 6 categories** | ✅ |
| **Agency** registration — lists in **Apartment, Villa/House, Land, Commercial** only | ✅ |
| Email-based auth (Firebase Auth / Supabase Auth — trial) | ✅ |
| Registration fields: user type, preference type, location, phone, email | ✅ |
| Post → admin verify listing → go live | ✅ |
| Edit / update / delete listings (CRUD) | ✅ |
| Admin: verification requests (owner & agency identity) | ✅ |
| Verification badge on verified profiles | ✅ |
| Admin: user management (client, owner, agency) | ✅ |
| Admin: property type management | ✅ |
| Admin: review management | ✅ |
| Admin: subscription management | ✅ |
| Admin: testimonials management | ✅ |

---

## Later (after the MVP is complete)

> **Focus first:** finish everything in the MVP checklist above before anything else.
> Once the MVP is fully built and working, optional enhancements can be considered — for example: a "still available?" check, owner enquiry alerts, save/shortlist, WhatsApp share, a report button, KYC API integration for automated verification, and opening more categories. These are **not part of the current scope.**

---

_A simple overview of the platform's current features and how they work together._
