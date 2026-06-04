
-- =========================================================
-- PHASE 1: PIVOT FROM RENTALS TO DEALERSHIP
-- =========================================================

-- 1. Drop rental-era objects
DROP TRIGGER IF EXISTS trg_validate_booking_insert ON public.bookings;
DROP TRIGGER IF EXISTS trg_protect_booking_financials ON public.bookings;
DROP TRIGGER IF EXISTS trg_notify_booking_event ON public.bookings;

DROP TABLE IF EXISTS public.tracking_logs CASCADE;
DROP TABLE IF EXISTS public.escrow_transactions CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.cars CASCADE;

DROP FUNCTION IF EXISTS public.validate_booking_insert() CASCADE;
DROP FUNCTION IF EXISTS public.protect_booking_financials() CASCADE;
DROP FUNCTION IF EXISTS public.notify_booking_event() CASCADE;
DROP FUNCTION IF EXISTS public.check_car_availability(uuid, date, date) CASCADE;

DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.escrow_status CASCADE;
DROP TYPE IF EXISTS public.car_status CASCADE;
DROP TYPE IF EXISTS public.vehicle_status CASCADE;
DROP TYPE IF EXISTS public.transmission_type CASCADE;
DROP TYPE IF EXISTS public.fuel_type CASCADE;

-- 2. Roles: add customer + dealer, migrate existing rows
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dealer';

-- (enum values need to be committed before use in DML in same tx in some Postgres versions;
--  Supabase migrations wrap each statement so this is fine)
