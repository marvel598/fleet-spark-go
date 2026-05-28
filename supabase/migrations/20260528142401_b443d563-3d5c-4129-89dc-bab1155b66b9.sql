
-- ============ 1. PROFILES: hide phone from public ============
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owners and admins view full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Public view excluding phone (sensitive PII)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url, bio, location, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- ============ 2. CARS: hide GPS from public ============
DROP POLICY IF EXISTS "Active cars are viewable by everyone" ON public.cars;

CREATE POLICY "Owners and admins view full car"
ON public.cars FOR SELECT
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Allow active renter to see GPS of car they have an active booking on
CREATE POLICY "Active renter views full car"
ON public.cars FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings b
  WHERE b.car_id = cars.id
    AND b.renter_id = auth.uid()
    AND b.status IN ('confirmed','active')
));

-- Public-browsable view without GPS columns
CREATE OR REPLACE VIEW public.cars_public
WITH (security_invoker = on) AS
SELECT id, owner_id, make, model, year, license_plate, transmission, fuel_type,
       seats, daily_price, location, description, photos, features, status,
       tracking_enabled, created_at, updated_at
FROM public.cars
WHERE status = 'active';

GRANT SELECT ON public.cars_public TO anon, authenticated;

-- ============ 3. BOOKINGS: block financial field tampering ============
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.total IS DISTINCT FROM OLD.total
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.service_fee IS DISTINCT FROM OLD.service_fee
     OR NEW.owner_payout IS DISTINCT FROM OLD.owner_payout
     OR NEW.daily_rate IS DISTINCT FROM OLD.daily_rate
     OR NEW.days IS DISTINCT FROM OLD.days
     OR NEW.car_id IS DISTINCT FROM OLD.car_id
     OR NEW.renter_id IS DISTINCT FROM OLD.renter_id
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
  THEN
    RAISE EXCEPTION 'Financial and identity fields on bookings cannot be modified by non-admin users';
  END IF;
  -- Only the owner may confirm payment received / mark completed
  IF NEW.payment_confirmed_at IS DISTINCT FROM OLD.payment_confirmed_at
     AND auth.uid() <> OLD.owner_id THEN
    RAISE EXCEPTION 'Only the car owner can confirm payment';
  END IF;
  IF NEW.owner_confirmed_at IS DISTINCT FROM OLD.owner_confirmed_at
     AND auth.uid() <> OLD.owner_id THEN
    RAISE EXCEPTION 'Only the car owner can confirm trip completion';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_financials_trg ON public.bookings;
CREATE TRIGGER protect_booking_financials_trg
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.protect_booking_financials();

-- ============ 4. Lock down SECURITY DEFINER helpers ============
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_booking_financials() FROM PUBLIC, anon, authenticated;
-- has_role and check_car_availability remain callable; they only return booleans and are used by RLS

-- ============ 5. NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users mark own notifications read"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Server-side notify function (admins or trigger-driven)
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.owner_id, 'New booking request',
            'You have a new booking awaiting payment.', 'booking', '/trips');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'confirmed' AND OLD.status <> 'confirmed' THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (NEW.renter_id, 'Payment confirmed',
              'Your host confirmed payment. Your trip is booked.', 'booking', '/my-bookings');
    ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (NEW.renter_id, 'Trip completed',
              'Thanks for riding with AurumDrive. Leave a review!', 'booking', '/my-bookings');
    ELSIF NEW.payment_reference IS NOT NULL AND OLD.payment_reference IS NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (NEW.owner_id, 'Renter submitted payment',
              'A renter submitted a payment reference. Confirm receipt.', 'booking', '/trips');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_booking_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_booking_insert ON public.bookings;
CREATE TRIGGER notify_booking_insert
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

DROP TRIGGER IF EXISTS notify_booking_update ON public.bookings
;
CREATE TRIGGER notify_booking_update
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

-- Realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
