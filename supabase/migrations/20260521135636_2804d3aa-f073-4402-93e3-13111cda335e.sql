-- Tracking-related enum
CREATE TYPE public.vehicle_status AS ENUM ('parked', 'on_rent', 'in_transit', 'maintenance', 'offline');

-- Extend cars with tracking fields
ALTER TABLE public.cars
  ADD COLUMN tracking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN current_lat numeric(9,6),
  ADD COLUMN current_lng numeric(9,6),
  ADD COLUMN last_location_update timestamptz,
  ADD COLUMN vehicle_status public.vehicle_status NOT NULL DEFAULT 'parked',
  ADD COLUMN current_odometer integer;

-- Extend bookings with trip metering
ALTER TABLE public.bookings
  ADD COLUMN pickup_odometer integer,
  ADD COLUMN return_odometer integer,
  ADD COLUMN pickup_lat numeric(9,6),
  ADD COLUMN pickup_lng numeric(9,6),
  ADD COLUMN return_lat numeric(9,6),
  ADD COLUMN return_lng numeric(9,6);

-- Tracking logs (location ping history)
CREATE TABLE public.tracking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  booking_id uuid,
  lat numeric(9,6) NOT NULL,
  lng numeric(9,6) NOT NULL,
  speed_kmh numeric(6,2),
  heading numeric(5,2),
  odometer integer,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_logs_car_time ON public.tracking_logs (car_id, recorded_at DESC);
CREATE INDEX idx_tracking_logs_booking ON public.tracking_logs (booking_id);

ALTER TABLE public.tracking_logs ENABLE ROW LEVEL SECURITY;

-- Owners + admins can view all logs for their cars
CREATE POLICY "Owners view tracking for their cars"
ON public.tracking_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.cars c WHERE c.id = tracking_logs.car_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Active renter can view logs for their own active booking
CREATE POLICY "Active renter views tracking for own booking"
ON public.tracking_logs FOR SELECT
USING (
  booking_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = tracking_logs.booking_id
      AND b.renter_id = auth.uid()
      AND b.status IN ('confirmed', 'active')
  )
);

-- Only owners/admins can insert pings
CREATE POLICY "Owners insert tracking pings"
ON public.tracking_logs FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.cars c WHERE c.id = tracking_logs.car_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);