# PROGRESS

## [2026-08-06]

- **Frontend**: Fixed missing "Room Sharing Options" UI block in the Admin edit property modal (`AdminPropertiesQueuePage.tsx`) to allow admins to correctly configure bed sharing options for PG/Hostels.
- **Frontend**: Expanded category logic checks in `OwnerPropertyFormPage.tsx` to ensure legacy property categories (`"pg"`, `"hostel"`) gracefully load and support room sharing capabilities.
- **Frontend**: Dynamically hid the "Pricing & Terms" block during PG/Hostel property creation/editing as it is intelligently derived from the lowest sharing option.
- **Frontend**: Refactored `PropertyDetailsPage.tsx` specification rendering to conditionally hide `0 Bed`, `0 Bath`, or `Not Specified` items. The property specifications grid now smartly reflows via CSS conditionally rendering borders (`first:border-0`) to maintain perfect layout alignment.
- **Frontend**: Resolved a React crash (`ReferenceError: conso is not defined`) in `AdminAddPropertyPage.tsx`.
- **Backend**: Resolved a `422 Unprocessable Entity` error during listing creation by properly updating Pydantic model schemas to support the consolidated `"pg_hostel"` and `"flat_apartment"` categories.
- **Backend**: Fixed a `403 Forbidden` property creation block for owner accounts by correcting role-based category logic in the backend `service.py` to match the model specifications rather than using hardcoded literals.

## [2026-07-19]

- **Frontend**: Unified authentication flow to be exclusively passwordless (OTP-based) via a centralized `AuthModal.tsx`, removing legacy standalone login and password forms.
- **Frontend**: Built and integrated a highly reusable `AppNavbar.tsx` across the app (`Welcome`, `Dashboards`, `PropertyDetailsPage`), centralizing user session state (login dropdown for guests, avatar dropdown for logged-in users) and replacing redundant legacy headers.
- **Frontend**: Restructured main app routing in `App.tsx` to make the Client Dashboard (`/dashboard`) a public route and the default landing page for the application.
- **Frontend**: Added automatic smart role-redirection to the Client Dashboard, ensuring Owners, Agencies, and Admins are seamlessly redirected to their respective private dashboards.
- **Frontend**: Resolved a critical infinite redirect loop bug caused by `PublicRoute` misconfiguration and restored missing geolocation states in the Dashboard components.

## [2026-07-18]Letsellr


- **Frontend**: Fixed properties not loading in the dashboard due to an API pagination response format mismatch.
- **Backend**: Added Pydantic schema `UserUpdateRequest` and endpoint `PUT /api/users/me` allowing authenticated users to update their profile details (name, preferred city, and preference type).
- **Backend**: Fixed a latent async SQLAlchemy bug — added `lazy="selectin"` to the `User.agency_profile` relationship in `models.py` to prevent `MissingGreenlet` errors when Pydantic serialises the ORM object outside an active async session.
- **Backend**: Created `tests/test_users.py` with 16 tests covering `GET /api/users/me`, `PUT /api/users/me`, schema correctness, partial-update behaviour, unauthenticated rejection, read-only field enforcement (email, phone), and cross-user isolation. All 37 tests (health + properties + users) pass.
- **Frontend**: Created high-fidelity `ProfileModal` component with custom backdrop blur and animated modal transitions.
- **Frontend**: Added inline profile edit mode inside the modal allowing modification of user name, preferred location, and interest type.
- **Frontend**: Enforced read-only status and locked styles for sensitive fields (Email, Phone) in profile edits.
- **Frontend**: Added live input validation (real-time error alerts for empty values, minimum length, and character validation).
- **Frontend**: Integrated profile picture and banner image uploads using `FileReader` to encode assets as Base64 data URLs, persisted in local storage per user.
- **Frontend**: Implemented real-time geolocation auto-detection on the location field in the profile editor and the dashboard search bar.
- **Frontend**: Connected the OpenStreetMap Nominatim reverse-geocoding API to resolve coordinates to a readable `"City, State"` string, replacing coordinates on both the profile and dashboard badges.
- **Frontend**: Cleaned up the profile modal footer in view mode, using the top-right `X` close button as the main close trigger.

## [2026-07-15]

- **Backend**: Added `POST /api/auth/refresh` endpoint allowing secure Supabase JWT session refreshment.
- **Frontend**: Setup shadcn/ui and themed components (`#308178` primary teal theme on a white base) integrated with Tailwind CSS v4.
- **Frontend**: Configured typescript paths alias `@/*` resolution.
- **Frontend**: Implemented full passwordless authentication pages (`Welcome` role picker, `RegisterOwnerAgency`, `RegisterClient` seeker, `Login`, `VerifyOTP`).
- **Frontend**: Built `AuthContext` to coordinate token states, profile requests, and login/registration flows.
- **Frontend**: Built an Axios API client interceptor to handle automated token refresh on `401 Unauthorized` responses and request queuing.
- **Frontend**: Setup role-guarded page routes (`/dashboard`, `/owner/dashboard`, `/admin`, `/profile`).
- **Frontend**: Verified frontend compilation and build outputs successfully via Vite production bundler.
