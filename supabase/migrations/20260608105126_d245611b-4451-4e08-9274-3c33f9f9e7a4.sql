
CREATE OR REPLACE FUNCTION public.validate_booking_addresses()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_pickup text := btrim(coalesce(NEW.pickup_location, ''));
  v_dropoff text := btrim(coalesce(NEW.dropoff_location, ''));
BEGIN
  IF v_pickup <> '' THEN
    IF char_length(v_pickup) < 5 OR char_length(v_pickup) > 200 THEN
      RAISE EXCEPTION 'Pickup address must be between 5 and 200 characters';
    END IF;
    IF v_pickup !~ '[A-Za-z]' THEN
      RAISE EXCEPTION 'Pickup address must contain letters';
    END IF;
    IF v_pickup !~ '^[A-Za-z0-9[:space:],.\-''/#&()]+$' THEN
      RAISE EXCEPTION 'Pickup address contains invalid characters';
    END IF;
    IF v_pickup ~* 'https?://' OR v_pickup ~ '[<>]' THEN
      RAISE EXCEPTION 'Pickup address cannot contain links or HTML';
    END IF;
    NEW.pickup_location := v_pickup;
  END IF;

  IF v_dropoff <> '' THEN
    IF char_length(v_dropoff) < 5 OR char_length(v_dropoff) > 200 THEN
      RAISE EXCEPTION 'Dropoff address must be between 5 and 200 characters';
    END IF;
    IF v_dropoff !~ '[A-Za-z]' THEN
      RAISE EXCEPTION 'Dropoff address must contain letters';
    END IF;
    IF v_dropoff !~ '^[A-Za-z0-9[:space:],.\-''/#&()]+$' THEN
      RAISE EXCEPTION 'Dropoff address contains invalid characters';
    END IF;
    IF v_dropoff ~* 'https?://' OR v_dropoff ~ '[<>]' THEN
      RAISE EXCEPTION 'Dropoff address cannot contain links or HTML';
    END IF;
    NEW.dropoff_location := v_dropoff;
  END IF;

  -- If delivery distances are provided, require addresses
  IF coalesce(NEW.delivery_distance_km, 0) > 0 AND v_pickup = '' THEN
    RAISE EXCEPTION 'Pickup address is required when delivery distance is set';
  END IF;
  IF coalesce(NEW.return_distance_km, 0) > 0 AND v_dropoff = '' THEN
    RAISE EXCEPTION 'Dropoff address is required when return distance is set';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_booking_addresses ON public.bookings;
CREATE TRIGGER trg_validate_booking_addresses
BEFORE INSERT OR UPDATE OF pickup_location, dropoff_location, delivery_distance_km, return_distance_km
ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_addresses();
