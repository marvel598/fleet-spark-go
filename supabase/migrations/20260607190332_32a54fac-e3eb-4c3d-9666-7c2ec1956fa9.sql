
-- Vehicles: delivery configuration
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS delivery_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_per_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_radius_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_delivery_km numeric NOT NULL DEFAULT 0;

-- Bookings: delivery details
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS delivery_distance_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS return_distance_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;

-- Lock delivery fields after insert (alongside other financials)
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_is_owner_or_admin boolean;
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

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT (public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.vehicles v
        LEFT JOIN public.dealers d ON d.id = v.dealer_id
        WHERE v.id = NEW.vehicle_id
          AND (v.owner_id = auth.uid() OR d.owner_id = auth.uid())
      )) INTO v_is_owner_or_admin;

    IF NOT v_is_owner_or_admin THEN
      IF NOT (auth.uid() = OLD.renter_id AND NEW.status = 'cancelled'::booking_status) THEN
        RAISE EXCEPTION 'Only owners, dealers or admins may change booking status';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
