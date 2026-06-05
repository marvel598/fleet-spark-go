# Unify Sales + Rental Marketplace

Restore the rental side, keep the dealership side, and merge them into one inventory with dual Buy/Rent flows.

## Phase 1 — Schema unification

**Extend `vehicles`** (single inventory)
- `listing_type` enum: `sale` | `rent` | `both`
- `daily_rate` numeric (nullable, required when rent/both)
- `min_rental_days`, `max_rental_days` (defaults 1, 30)
- `owner_id` uuid (nullable) — set when an `owner` lists a personal car for rent; `dealer_id` stays for dealership-listed vehicles. One of the two must be set (trigger check).
- Keep all existing sale fields (price, msrp, condition, photos, etc.).

**Restore tables**
- `bookings` — vehicle_id, renter_id, start_date, end_date, days, daily_rate, subtotal, service_fee, total, owner_payout, status (pending/confirmed/active/completed/cancelled), pickup_location, dropoff_location.
- `escrow_transactions` — booking_id, amount, owner_payout, platform_fee, status (held/released/refunded), provider_ref.
- `trip_reviews` (renamed from old `reviews`) — booking_id, vehicle_id, renter_id, owner_rating, vehicle_rating, comment. Sales `vehicle_reviews` (expert) stays separate.

**Triggers (restored, adapted)**
- `validate_booking_insert` — start < end, vehicle.listing_type in (rent,both), no overlap with confirmed/active.
- `protect_booking_financials` — block edits to money fields after insert.
- `notify_booking_event` — notification on status changes.
- `check_vehicle_availability` — replaces old `check_car_availability`.

**Roles** — extend enum to: `customer`, `dealer`, `owner`, `renter`, `admin`.
- `dealer`: lists for sale (and optionally rent) via dealership.
- `owner`: peer-to-peer rental host.
- `renter`: rents vehicles.
- `customer`: buys vehicles.
- A user can hold multiple roles (e.g. renter+customer).

**RLS additions**
- `bookings`: renter sees own; owner/dealer sees bookings on their vehicles; admin all. Insert by authenticated renter only.
- `escrow_transactions`: parties to the booking + admin; no client writes (edge function only).
- `trip_reviews`: public read, renter writes own after completed booking.
- `vehicles`: existing dealer policy + add owner CRUD on their own listings.

## Phase 2 — Frontend unification

**Routes**
- `/` — homepage with two hero CTAs: "Buy a car" → `/inventory`, "Rent a car" → `/rentals`. Featured strip shows both, badged.
- `/inventory` — sales filter (existing). Add `listing_type` filter chip "For sale".
- `/rentals` — new search page: date range + location filters, daily rate range, fuel/transmission. Pulls vehicles where `listing_type in (rent,both)`.
- `/vehicle/:id` — unified detail page. Shows Buy panel if sale/both, Rent panel (date picker + price breakdown) if rent/both. Dual CTAs.
- `/trips` — restored renter "My Bookings" page.
- `/account` — adds Bookings tab next to Saved/Inquiries/Finance.
- `/owner` — new owner hub: list-a-car, my listings, incoming bookings, payouts.
- `/dealer` — unchanged, but vehicle edit form gains rental fields when listing_type ≠ sale.

**Signup** — role chooser becomes 4-way: Buy / Sell (dealer) / Rent / Host a car (owner). Multi-select allowed.

**Header** — add "Rentals" nav item between Inventory and Compare. "Owner Hub" link when role=owner. Keep Dealer Hub for dealers.

## Phase 3 — Booking + escrow flow

- Restore `src/lib/pricing.ts` usage on the rent panel (30/70 split kept).
- Booking widget on `/vehicle/:id` (date range → price breakdown → confirm → insert booking).
- Owner hub: confirm / cancel / mark-completed actions.
- Escrow: stub provider (same pattern as before) — held on confirm, released on completed, refunded on cancel. Implemented via edge function `booking-escrow`.
- Notifications: booking created/confirmed/cancelled/completed → both parties.

## Phase 4 — Polish

- Vehicle card shows price badge (sale) and/or "/day" badge (rent) depending on listing_type.
- JSON-LD: keep `Vehicle` schema for sale; add `Product`/`Offer` rentals variant.
- Security scan re-run after migration.

## Technical notes

- Existing migration kept; this is additive (re-adds dropped tables under new names where needed). No data loss on current dealership data.
- Storage bucket stays `car-photos` (already public).
- Edge function: `booking-escrow` for state transitions, uses service role.
- No new third-party providers.

## What ships in round 1

I'll execute **Phase 1 (full migration) + Phase 2 routes scaffolding + Phase 3 booking flow** in one go. Phase 4 polish follows after you've clicked through.

If you want to trim (e.g. defer owner hub, defer escrow to a stub), tell me before I start.
