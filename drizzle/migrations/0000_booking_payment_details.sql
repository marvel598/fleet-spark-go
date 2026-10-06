-- Payment tracking for manual M-Pesa / mobile money bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN public.bookings.payment_method IS 'Payment channel used by renter, e.g. M-Pesa / Mobile Money';
COMMENT ON COLUMN public.bookings.payment_reference IS 'Transaction reference submitted by the renter, verified by the owner';
COMMENT ON COLUMN public.bookings.paid_at IS 'Set by the vehicle owner when payment is confirmed';

-- Extend the booking protection trigger: renters may submit payment details
-- only while a booking is pending or confirmed, and can never mark it paid.
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_owner_or_admin boolean;
  v_is_renter boolean;
  v_payment_changed boolean;
BEGIN
  IF NEW.daily_rate <> OLD.daily_rate
     OR NEW.subtotal <> OLD.subtotal
     OR NEW.service_fee <> OLD.service_fee
     OR NEW.total <> OLD.total
     OR NEW.owner_payout <> OLD.owner_payout
     OR NEW.delivery_fee <> OLD.delivery_fee
     OR NEW.delivery_distance_km <> OLD.delivery_distance_km
     OR NEW.return_distance_km <> OLD.return_distance_km
     OR NEW.days <> OLD.days
     OR NEW.start_date <> OLD.start_date
     OR NEW.end_date <> OLD.end_date
     OR NEW.vehicle_id <> OLD.vehicle_id
     OR NEW.renter_id <> OLD.renter_id THEN
    RAISE EXCEPTION 'Financial and core booking fields cannot be modified';
  END IF;

  SELECT (public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.vehicles v
      LEFT JOIN public.dealers d ON d.id = v.dealer_id
      WHERE v.id = NEW.vehicle_id
        AND (v.owner_id = auth.uid() OR d.owner_id = auth.uid())
    )) INTO v_is_owner_or_admin;

  v_is_renter := (auth.uid() = OLD.renter_id);

  v_payment_changed := NEW.payment_method IS DISTINCT FROM OLD.payment_method
    OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference;

  -- Renters can only cancel their own booking and cannot edit other fields
  IF v_is_renter AND NOT v_is_owner_or_admin THEN
    IF NEW.pickup_location IS DISTINCT FROM OLD.pickup_location
       OR NEW.dropoff_location IS DISTINCT FROM OLD.dropoff_location
       OR NEW.notes IS DISTINCT FROM OLD.notes THEN
      RAISE EXCEPTION 'Renters cannot modify booking details after creation';
    END IF;
    IF NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
      RAISE EXCEPTION 'Only the vehicle owner may mark a booking as paid';
    END IF;
    IF v_payment_changed
       AND (OLD.status NOT IN ('pending','confirmed')
            OR NEW.status NOT IN ('pending','confirmed')) THEN
      RAISE EXCEPTION 'Payment details can only be submitted while the booking is pending or confirmed';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status <> 'cancelled'::booking_status THEN
      RAISE EXCEPTION 'Renters may only cancel their own bookings';
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT v_is_owner_or_admin THEN
      IF NOT (v_is_renter AND NEW.status = 'cancelled'::booking_status) THEN
        RAISE EXCEPTION 'Only owners, dealers or admins may change booking status';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
