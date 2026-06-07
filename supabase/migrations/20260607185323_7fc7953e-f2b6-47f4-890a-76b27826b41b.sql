
-- 1. Restrict dealer contact columns from anonymous users
REVOKE SELECT ON public.dealers FROM anon;
GRANT SELECT (id, name, slug, logo_url, address, city, region, country, website, hours, about, owner_id, created_at, updated_at) ON public.dealers TO anon;

-- 2. Extend booking protection trigger to cover status changes by renters
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_is_owner_or_admin boolean;
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

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT (public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.vehicles v
        LEFT JOIN public.dealers d ON d.id = v.dealer_id
        WHERE v.id = NEW.vehicle_id
          AND (v.owner_id = auth.uid() OR d.owner_id = auth.uid())
      )) INTO v_is_owner_or_admin;

    IF NOT v_is_owner_or_admin THEN
      -- A renter may only cancel their own booking; nothing else.
      IF NOT (auth.uid() = OLD.renter_id AND NEW.status = 'cancelled'::booking_status) THEN
        RAISE EXCEPTION 'Only owners, dealers or admins may change booking status';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
