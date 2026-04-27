ALTER TABLE public.bookings
  ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN payment_reference TEXT,
  ADD COLUMN payment_phone TEXT,
  ADD COLUMN payment_submitted_at TIMESTAMPTZ,
  ADD COLUMN payment_confirmed_at TIMESTAMPTZ;