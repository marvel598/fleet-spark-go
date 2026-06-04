# Pivot to Car Dealership

Replace the rental marketplace (bookings, owners, renters, escrow, tracking) with a dealership sales model. Big change — laid out in phases so you can ship and review incrementally.

## Phase 1 — Schema + roles

Replace rental concepts with sales concepts. Keep `profiles`, `user_roles`, `role_audit_log`, `notifications`.

**New tables**
- `vehicles` — make, model, year, trim, body_type, mileage, price, msrp, condition (new/used/certified), fuel_type, transmission, drivetrain, exterior_color, interior_color, vin, stock_number, photos[], features[], description, status (available/pending/sold), dealer_id
- `dealers` — name, logo, address, city, phone, email, website, hours, about
- `inquiries` — vehicle_id, user_id, name, email, phone, message, type (info/test_drive/finance/offer), preferred_date, status (new/contacted/closed)
- `finance_applications` — vehicle_id, user_id, vehicle_price, down_payment, term_months, apr, monthly_payment, employment info, status
- `vehicle_reviews` — expert reviews tied to make/model/year (rating, title, body, author, pros[], cons[])
- `comparisons` — user_id, vehicle_ids[] (saved comparison sets)
- `saved_vehicles` — user_id, vehicle_id (favorites)

**Roles** swap `owner`/`renter`/`driver` → `customer`, `dealer`, `admin` (keep admin). Migrate existing role rows to `customer`.

**Drop** `bookings`, `cars`, `escrow_transactions`, `tracking_logs`, related triggers (`validate_booking_insert`, `protect_booking_financials`, `notify_booking_event`, `check_car_availability`), `car-photos` bucket renamed conceptually to `vehicle-photos`.

**RLS**: `vehicles` public SELECT for `status='available'`, dealers CRUD their own; `inquiries` customers insert/view own + dealers view their vehicle's; `finance_applications` private to applicant + dealer; `vehicle_reviews` public read, admin write; `saved_vehicles`/`comparisons` private to user. GRANTs as required.

## Phase 2 — Public pages

- **Homepage** (`/`) — hero with prominent search bar (make/model/price), featured vehicles carousel, promotions strip, browse-by-body-type tiles, "why buy from us" trust band.
- **Inventory / Search** (`/inventory`) — filter sidebar (make, model, year range, price range, mileage, fuel, transmission, body type, location), result grid, sort, pagination, save-search.
- **Vehicle Detail** (`/vehicle/:id`) — photo gallery, spec table, price + financing widget, dealer info card, CTA buttons (Inquire, Test Drive, Apply Financing, Make Offer), similar vehicles, embedded reviews for that make/model.
- **Compare** (`/compare`) — pick up to 4, side-by-side spec table, highlight differences.
- **Reviews** (`/reviews`, `/reviews/:make/:model`) — expert review listings.

## Phase 3 — Tools + conversion

- **Finance Calculator** (`/finance/calculator`) — price, down payment, trade-in, APR, term → monthly payment, total interest, amortization preview. Standalone + embedded on vehicle page.
- **Inquiry / Test Drive / Offer forms** — modal flow from vehicle page, writes to `inquiries`.
- **Financing application** — multi-step form, writes to `finance_applications`.
- **Saved vehicles + comparisons** — auth-gated.

## Phase 4 — Dashboards

- **Customer dashboard** (`/account`) — saved vehicles, my inquiries, finance applications status.
- **Dealer dashboard** (`/dealer`) — inventory CRUD (list/add/edit/photos/status), inquiries inbox with statuses, finance application pipeline, simple analytics (views, leads, conversion).
- **Admin** — keep audit log, manage dealers, manage expert reviews, role grants.

## Phase 5 — Polish

Refresh homepage/inventory under the existing Midnight Indigo palette + lifestyle typography + hero-grid layout. Re-run security scan after the schema swap.

## Technical details

- Tech: existing Vite + React + Tailwind + shadcn + Lovable Cloud (Supabase). No new providers.
- Auth: keep existing email/password + Google flow; signup chooses `customer` or `dealer`.
- Storage: rename usage to `vehicle-photos` bucket (or reuse `car-photos` with new path prefix).
- Migration strategy: destructive — drop rental tables, no data migration (rental data is test).
- SEO: vehicle detail pages get JSON-LD `Vehicle` schema, canonical URLs, dynamic title/meta.

## What I need from you

This is ~5 phases of work. Tell me:

1. **Go destructive?** Drop `bookings`/`cars`/`escrow`/`tracking` cleanly, or archive them?
2. **Start where?** Recommend **Phase 1 + Phase 2** in the first round so you see the new model and homepage/inventory immediately. Phases 3–5 follow.
3. **Multi-dealer or single dealer?** The plan assumes multi-dealer (marketplace). If you're a single dealership, I'll simplify (drop `dealers` table, hardcode dealer info).