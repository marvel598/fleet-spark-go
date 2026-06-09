
-- 1) Dealers: hide phone & email from anonymous users via column-level grants
REVOKE SELECT ON public.dealers FROM anon;
GRANT SELECT (
  id, created_at, updated_at, owner_id, name, slug, logo_url,
  address, city, region, country, website, hours, about
) ON public.dealers TO anon;

-- 2) Vehicles: hide vin & stock_number from anonymous users via column-level grants
REVOKE SELECT ON public.vehicles FROM anon;
GRANT SELECT (
  id, created_at, updated_at, dealer_id, owner_id, make, model, year, trim,
  price, msrp, mileage, body_type, condition, status, listing_type,
  fuel_type, transmission, drivetrain, engine, exterior_color, interior_color,
  photos, features, location, description, views_count, daily_rate,
  min_rental_days, max_rental_days, delivery_available, delivery_fee_base,
  delivery_fee_per_km, free_delivery_radius_km, max_delivery_km
) ON public.vehicles TO anon;

-- 3) Bookings: restrict what renters can change after creation
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_owner_or_admin boolean;
  v_is_renter boolean;
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

  -- Renters can only cancel their own booking and cannot edit other fields
  IF v_is_renter AND NOT v_is_owner_or_admin THEN
    IF NEW.pickup_location IS DISTINCT FROM OLD.pickup_location
       OR NEW.dropoff_location IS DISTINCT FROM OLD.dropoff_location
       OR NEW.notes IS DISTINCT FROM OLD.notes THEN
      RAISE EXCEPTION 'Renters cannot modify booking details after creation';
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
