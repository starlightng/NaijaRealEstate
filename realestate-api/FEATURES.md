# NaijaProperty — Feature Documentation

## Overview

NaijaProperty is a Nigerian community real estate platform that connects landlords, agents, and tenants. It supports listing properties in ₦ Naira with Nigerian-specific location data (state, LGA, landmarks).

## Roles & Permissions

| Role       | Capabilities                                                              |
|-----------|--------------------------------------------------------------------------|
| Landlord   | Create/manage own listings, view inquiries, respond to leads              |
| Agent      | Manage listings on behalf of landlords, view all leads, manage pipeline   |
| Admin      | Moderate listings (approve/reject), manage users, view audit logs         |

## Core Features

### 1. Authentication (`/auth/*`)

- **Register** — Create account with email, password, name, and role selection.
- **Login** — Authenticate with email/password. Issues JWT access token + rotating refresh token.
- **Refresh** — Rotate refresh tokens (old token revoked, new token issued).
- **Logout** — Revoke refresh token and clear HttpOnly cookie.
- **Password Reset** — Request reset link, confirm with token.
- **Change Password** — Authenticated users can change their password.

### 2. User Management (`/users/*`)

- **Profile** — View and update own profile (`GET /users/me`, `PUT /users/me`).
- **Admin** — List all users, view user details, activate/deactivate accounts.

### 3. Property Listings (`/properties/*`)

**Public Endpoints:**
- Browse approved listings with full-text search, filters (city, state, LGA, property type, price range, bedrooms).
- View individual property detail with image gallery.
- Nigerian context metadata endpoint (states, cities, amenities).

**Authenticated Endpoints:**
- Create listings (landlord/agent) with Nigerian state validation.
- Edit own listings (draft/pending/rejected only).
- Submit draft for admin review.
- Soft-delete own listings.
- View own listings with status filter.

**Listing Lifecycle:**
```
draft → pending_review → approved  (by admin)
                       → rejected   (with rejection note)
archived / rented / sold (manual)
```

### 4. Image Uploads (`/uploads/*`)

- Upload property images (JPEG, PNG, WebP).
- Auto-resize to max dimensions.
- Set primary image for a property.
- Delete images.
- Max 10 MB per file.

### 5. Lead Management (`/inquiries/*`)

- Send inquiry about a property (creates a lead).
- **Lead Status**: `new → contacted → closed`
- **Timeline**: Every status change, note, and follow-up is logged with timestamp and actor.
- Agent dashboard shows pipeline with status badges.
- Add notes and follow-up events to any lead.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/inquiries/` | Create inquiry (authenticated) |
| GET | `/inquiries/` | List all leads (agent/admin) |
| GET | `/inquiries/{id}` | Lead detail with timeline |
| PATCH | `/inquiries/{id}/status` | Update lead status |
| POST | `/inquiries/{id}/timeline` | Add note/follow-up |
| GET | `/inquiries/{id}/timeline` | Get timeline events |

### 6. Admin Panel (`/admin/*`)

- Dashboard statistics (user counts, property counts).
- Moderation queue with approve/reject actions.
- User management (list, toggle active).
- Audit log viewer.

### 7. Nigerian Market Context

- States, LGAs, and popular cities data.
- Currency: ₦ Naira.
- Nigerian-specific property types and amenities.
- Title document types.

## Data Models

### User
- `id` (UUID), `email`, `password_hash`, `full_name`, `phone`
- `role` (landlord/agent/admin), `is_active`, `is_verified`
- `last_login_at`, soft-delete via `deleted_at`

### Property
- `id` (UUID), `owner_id`, `agent_id` (optional)
- `title`, `description`, `property_type`, `listing_type`
- `price` (Numeric), `price_period`, `price_negotiable`
- `bedrooms`, `bathrooms`, `toilets`, `area_sqm`
- `address`, `landmark`, `lga`, `city`, `state`, `country`, `lat/lng`
- `amenities` (JSON array), `video_url`
- `status` (draft/pending_review/approved/rejected/archived/rented/sold)
- `featured`, `view_count`, `inquiry_count`
- Soft-delete via `deleted_at`

### Inquiry / Lead
- `id` (Integer), `property_id`, `sender_id`, `message`
- `status` (new/contacted/closed)
- `timeline_events` — event_type, note, created_by, timestamp

## Future Enhancements

- Email notifications (aiosmtplib configured, email service stub ready)
- Real-time chat via WebSockets
- Property comparison tool
- Saved searches with alerts
- Mobile app (React Native)
- Payment integration for featured listings
