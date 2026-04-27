-- Booking status enum
CREATE TYPE public.booking_status AS ENUM (
  'pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'
);

CREATE TYPE public.escrow_status AS ENUM ('held', 'released', 'refunded');

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  daily_rate NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  service_fee NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  owner_payout NUMERIC(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending_payment',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  renter_confirmed_at TIMESTAMPTZ,
  owner_confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_bookings_car ON public.bookings(car_id);
CREATE INDEX idx_bookings_renter ON public.bookings(renter_id);
CREATE INDEX idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX idx_bookings_dates ON public.bookings(car_id, start_date, end_date) WHERE status IN ('confirmed', 'active');

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Renters view their bookings" ON public.bookings FOR SELECT
  USING (auth.uid() = renter_id OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Renters create bookings" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Parties update bookings" ON public.bookings FOR UPDATE
  USING (auth.uid() = renter_id OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Escrow
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  service_fee NUMERIC(10,2) NOT NULL,
  owner_payout NUMERIC(10,2) NOT NULL,
  status escrow_status NOT NULL DEFAULT 'held',
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View escrow for own bookings" ON public.escrow_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
      AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_car ON public.reviews(car_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Renters write reviews for completed trips" ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = renter_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.renter_id = auth.uid()
        AND b.status = 'completed'
    )
  );

-- Availability check function
CREATE OR REPLACE FUNCTION public.check_car_availability(
  _car_id UUID, _start DATE, _end DATE
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE car_id = _car_id
      AND status IN ('confirmed', 'active', 'pending_payment')
      AND daterange(start_date, end_date, '[]') && daterange(_start, _end, '[]')
  );
$$;