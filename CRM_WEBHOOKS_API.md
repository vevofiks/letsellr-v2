# Letsellr CRM Integration API (Webhooks)

This API allows external CRM applications to sync their property listings with the Letsellr platform.

## Base URL
`https://api.letsellr.in/api/webhooks/crm/properties`

## Authentication (Safety Check)
All requests to the CRM Webhooks API must include the secret safety key in the headers.

**Header Name:** `X-CRM-Secret`
**Value:** `<YOUR_PROVIDED_SECRET_KEY>`

---

## 1. Create Property
**Method:** `POST`
**Endpoint:** `/`

Creates a new property listing on Letsellr. The property will automatically be assigned to the user matching the `owner_phone`.

### Request Body (JSON)
```json
{
  "category": "apartment", // "pg", "hostel", "apartment", "villa_house", "land", "commercial"
  "intent": "rent", // "rent", "buy", "lease"
  "title": "Stunning 3BHK in Marine Drive",
  "description": "A beautiful 3BHK apartment with sea view...",
  "price": 45000,
  "price_unit": "per_month", // "per_month" or "total"
  "deposit": 100000,
  "area": 1500,
  "bedrooms": 3,
  "bathrooms": 2,
  "furnishing": "furnished", // "unfurnished", "semi", "furnished"
  "amenities": ["Parking", "Gym", "Pool"],
  "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  "video_link": "https://youtube.com/watch?v=...",
  "location": {
    "address": "Marine Drive, Tower A",
    "area": "Marine Drive",
    "city": "Kochi",
    "state": "Kerala",
    "pincode": "682031",
    "latitude": 9.9816,
    "longitude": 76.2999
  },
  "owner_phone": "+919876543210", // REQUIRED: Used to map the property to the agent/owner
  "status": "live" // "draft", "pending_review", or "live"
}
```

### Response (201 Created)
```json
{
  "id": "uuid-string-here",
  "ref": "PROP-AB12CD",
  "title": "Stunning 3BHK in Marine Drive",
  "status": "live",
  "url": "https://letsellr.in/properties/PROP-AB12CD"
}
```

---

## 2. Get Property Details
**Method:** `GET`
**Endpoint:** `/{property_ref}`

Fetches the current status and details of a property using its Letsellr Reference Code (e.g., `PROP-AB12CD`).

### Response (200 OK)
```json
{
  "id": "uuid-string-here",
  "ref": "PROP-AB12CD",
  "title": "Stunning 3BHK in Marine Drive",
  "price": 45000,
  "status": "live",
  "stats": {
    "views": 145,
    "enquiries": 12
  }
}
```

---

## 3. Update Property
**Method:** `PATCH`
**Endpoint:** `/{property_ref}`

Updates specific fields of an existing property. You only need to send the fields you want to change.

### Request Body (JSON)
```json
{
  "price": 42000,
  "status": "draft"
}
```

### Response (200 OK)
```json
{
  "id": "uuid-string-here",
  "ref": "PROP-AB12CD",
  "status": "draft",
  "message": "Property updated successfully."
}
```

---

## 4. Delete Property
**Method:** `DELETE`
**Endpoint:** `/{property_ref}`

Permanently removes the property listing from Letsellr.

### Response (204 No Content)
*Empty response body with HTTP Status 204.*
