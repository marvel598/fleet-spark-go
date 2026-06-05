
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'renter';

-- 2. New enums
DO $$ BEGIN
  CREATE TYPE public.listing_type AS ENUM ('sale','rent','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','active','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.escrow_status AS ENUM ('held','released','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Extend vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS listing_type public.listing_type NOT NULL DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS daily_rate numeric,
  ADD COLUMN IF NOT EXISTS min_rental_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_rental_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE public.vehicles ALTER COLUMN dealer_id DROP NOT NULL;

-- Owner CRUD on their own listings
DROP POLICY IF EXISTS "Owners manage own vehicles" ON public.vehicles;
CREATE POLICY "Owners manage own vehicles" ON public.vehicles
  FOR ALL
  USING (owner_id IS NOT NULL AND auth.uid() = owner_id)
  WITH CHECK (owner_id IS NOT NULL AND auth.uid() = owner_id);

-- Trigger: vehicle must have dealer_id OR owner_id; rent listings need daily_rate
CREATE OR REPLACE FUNCTION public.validate_vehicle_listing()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.dealer_id IS NULL AND NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'Vehicle must have a dealer or owner';
  END IF;
  IF NEW.listing_type IN ('rent','both') AND (NEW.daily_rate IS NULL OR NEW.daily_rate <= 0) THEN
    RAISE EXCEPTION 'Rental listings require a positive daily_rate';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_vehicle_listing ON public.vehicles;
CREATE TRIGGER trg_validate_vehicle_listing
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.validate_vehicle_listing();

-- 4. Drop legacy reviews table (rental-era schema)
DROP TABLE IF EXISTS public.reviews CASCADE;

-- 5. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  renter_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  daily_rate numeric NOT NULL,
  subtotal numeric NOT NULL,
  service_fee numeric NOT NULL,
  total numeric NOT NULL,
  owner_payout numeric NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  pickup_location text,
  dropoff_location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Renters view own bookings" ON public.bookings FOR SELECT
  USING (
    auth.uid() = renter_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.vehicles v
      LEFT JOIN public.dealers d ON d.id = v.dealer_id
      WHERE v.id = bookings.vehicle_id
        AND (v.owner_id = auth.uid() OR d.owner_id = auth.uid())
    )
  );

CREATE POLICY "Renters insert own bookings" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Owners and dealers update bookings" ON public.bookings FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.uid() = renter_id
    OR EXISTS (
      SELECT 1 FROM public.vehicles v
      LEFT JOIN public.dealers d ON d.id = v.dealer_id
      WHERE v.id = bookings.vehicle_id
        AND (v.owner_id = auth.uid() OR d.owner_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON public.bookings(renter_id);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_booking_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_listing public.listing_type;
DECLARE v_min int; DECLARE v_max int;
BEGIN
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'start_date must be before end_date';
  END IF;
  SELECT listing_type, min_rental_days, max_rental_days INTO v_listing, v_min, v_max
    FROM public.vehicles WHERE id = NEW.vehicle_id;
  IF v_listing IS NULL OR v_listing NOT IN ('rent','both') THEN
    RAISE EXCEPTION 'Vehicle is not available for rent';
  END IF;
  IF NEW.days < v_min OR NEW.days > v_max THEN
    RAISE EXCEPTION 'Booking length outside allowed range';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.vehicle_id = NEW.vehicle_id
      AND b.status IN ('confirmed','active')
      AND NOT (b.end_date <= NEW.start_date OR b.start_date >= NEW.end_date)
  ) THEN
    RAISE EXCEPTION 'Vehicle is already booked for the selected dates';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_booking_insert ON public.bookings;
CREATE TRIGGER trg_validate_booking_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_insert();

-- Protect financial fields on update
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.daily_rate <> OLD.daily_rate
     OR NEW.subtotal <> OLD.subtotal
     OR NEW.service_fee <> OLD.service_fee
     OR NEW.total <> OLD.total
     OR NEW.owner_payout <> OLD.owner_payout
     OR NEW.days <> OLD.days
     OR NEW.start_date <> OLD.start_date
     OR NEW.end_date <> OLD.end_date
     OR NEW.vehicle_id <> OLD.vehicle_id
     OR NEW.renter_id <> OLD.renter_id THEN
    RAISE EXCEPTION 'Financial and core booking fields cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_booking_financials ON public.bookings;
CREATE TRIGGER trg_protect_booking_financials
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_booking_financials();

-- updated_at
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify on booking event
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  -- Notify renter
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.renter_id, 'booking',
    CASE WHEN TG_OP = 'INSERT' THEN 'Booking submitted'
         ELSE 'Booking ' || NEW.status::text END,
    'Your booking ' || substr(NEW.id::text,1,8) || ' is ' || NEW.status::text,
    '/trips');

  -- Notify owner / dealer
  SELECT COALESCE(v.owner_id, d.owner_id) INTO v_owner
  FROM public.vehicles v LEFT JOIN public.dealers d ON d.id = v.dealer_id
  WHERE v.id = NEW.vehicle_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.renter_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_owner, 'booking',
      CASE WHEN TG_OP = 'INSERT' THEN 'New booking request' ELSE 'Booking ' || NEW.status::text END,
      'Booking ' || substr(NEW.id::text,1,8) || ' for your vehicle',
      '/owner');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_booking_insert ON public.bookings;
CREATE TRIGGER trg_notify_booking_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

DROP TRIGGER IF EXISTS trg_notify_booking_status ON public.bookings;
CREATE TRIGGER trg_notify_booking_status
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_booking_event();

-- 6. Escrow transactions
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  amount numeric NOT NULL,
  owner_payout numeric NOT NULL,
  platform_fee numeric NOT NULL,
  status public.escrow_status NOT NULL DEFAULT 'held',
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.escrow_transactions TO authenticated;
GRANT ALL ON public.escrow_transactions TO service_role;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view escrow" ON public.escrow_transactions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      LEFT JOIN public.vehicles v ON v.id = b.vehicle_id
      LEFT JOIN public.dealers d ON d.id = v.dealer_id
      WHERE b.id = escrow_transactions.booking_id
        AND (b.renter_id = auth.uid() OR v.owner_id = auth.uid() OR d.owner_id = auth.uid())
    )
  );

DROP TRIGGER IF EXISTS trg_escrow_updated_at ON public.escrow_transactions;
CREATE TRIGGER trg_escrow_updated_at
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Trip reviews
CREATE TABLE IF NOT EXISTS public.trip_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  vehicle_id uuid NOT NULL,
  renter_id uuid NOT NULL,
  vehicle_rating integer NOT NULL CHECK (vehicle_rating BETWEEN 1 AND 5),
  owner_rating integer CHECK (owner_rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.trip_reviews TO authenticated;
GRANT SELECT ON public.trip_reviews TO anon;
GRANT ALL ON public.trip_reviews TO service_role;
ALTER TABLE public.trip_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip reviews public" ON public.trip_reviews FOR SELECT USING (true);

CREATE POLICY "Renter writes own trip review" ON public.trip_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = renter_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = trip_reviews.booking_id
        AND b.renter_id = auth.uid()
        AND b.status = 'completed'
    )
  );

-- 8. Update handle_new_user to support new roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  selected_role app_role;
  meta_role text;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.phone,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;

  meta_role := NULLIF(NEW.raw_user_meta_data ->> 'role', '');
  IF meta_role IS NOT NULL THEN
    BEGIN
      selected_role := meta_role::app_role;
      IF selected_role <> 'customer' AND selected_role <> 'admin' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, selected_role)
        ON CONFLICT DO NOTHING;
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
