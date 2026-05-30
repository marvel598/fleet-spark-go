
-- 1) Booking INSERT validation: recalculate financials, force pending_payment, verify owner_id and days
CREATE OR REPLACE FUNCTION public.validate_booking_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  car_row public.cars%ROWTYPE;
  computed_days integer;
  computed_subtotal numeric;
  computed_service_fee numeric;
  computed_total numeric;
  computed_owner_payout numeric;
BEGIN
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Renter must be the caller
  IF NEW.renter_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'renter_id must match the authenticated user';
  END IF;

  -- Load car
  SELECT * INTO car_row FROM public.cars WHERE id = NEW.car_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car not found';
  END IF;
  IF car_row.status <> 'active' THEN
    RAISE EXCEPTION 'Car is not available for booking';
  END IF;

  -- Force trustworthy values
  NEW.owner_id := car_row.owner_id;
  NEW.daily_rate := car_row.daily_price;
  NEW.status := 'pending_payment'::booking_status;
  NEW.payment_confirmed_at := NULL;
  NEW.owner_confirmed_at := NULL;
  NEW.renter_confirmed_at := NULL;
  NEW.cancelled_at := NULL;

  -- Date sanity
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be on or after start_date';
  END IF;
  computed_days := GREATEST((NEW.end_date - NEW.start_date) + 1, 1);
  NEW.days := computed_days;

  -- Recompute pricing server-side (15% service fee, owner keeps 85%)
  computed_subtotal := ROUND(car_row.daily_price * computed_days, 2);
  computed_service_fee := ROUND(computed_subtotal * 0.15, 2);
  computed_total := ROUND(computed_subtotal + computed_service_fee, 2);
  computed_owner_payout := ROUND(computed_subtotal * 0.85, 2);

  NEW.subtotal := computed_subtotal;
  NEW.service_fee := computed_service_fee;
  NEW.total := computed_total;
  NEW.owner_payout := computed_owner_payout;

  -- No client-supplied stripe references on insert
  NEW.stripe_payment_intent_id := NULL;
  NEW.stripe_session_id := NULL;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_booking_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS validate_booking_insert_trg ON public.bookings;
CREATE TRIGGER validate_booking_insert_trg
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_insert();

-- 2) Tighten car-photos storage: verify the car_id in the path belongs to the uploader
-- Expected path layout: <user_id>/<car_id>/<filename>
DROP POLICY IF EXISTS "Owners can upload car photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update car photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete car photos" ON storage.objects;

CREATE POLICY "Owners can upload car photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update car photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'car-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete car photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'car-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.owner_id = auth.uid()
  )
);

-- 3) Realtime: restrict broadcast/presence subscriptions to user-scoped topics.
--    Postgres-changes still rely on source-table RLS (already enforced on notifications).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User-scoped realtime topics" ON realtime.messages;
CREATE POLICY "User-scoped realtime topics"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'user:' || auth.uid()::text || '%'
  OR realtime.topic() LIKE 'postgres_changes%'
);

-- 4) Restore EXECUTE on has_role so RLS-evaluating views (cars_public / profiles_public)
--    can run for anon and authenticated. has_role is SECURITY DEFINER with a fixed
--    search_path and only returns a boolean for the supplied user_id.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
