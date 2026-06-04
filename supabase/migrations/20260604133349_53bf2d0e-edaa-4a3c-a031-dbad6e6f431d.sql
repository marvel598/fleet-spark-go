
-- =========================================================
-- PHASE 1b: Migrate roles, update signup trigger, create dealership tables
-- =========================================================

-- Migrate role rows
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'customer'::app_role FROM public.user_roles
WHERE role IN ('renter','driver','owner')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'dealer'::app_role FROM public.user_roles
WHERE role = 'owner'
ON CONFLICT DO NOTHING;

DELETE FROM public.user_roles WHERE role IN ('renter','driver','owner');

-- New signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.phone,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;

  selected_role := NULLIF(NEW.raw_user_meta_data ->> 'role', '')::app_role;
  IF selected_role = 'dealer' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dealer')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Enums
CREATE TYPE public.vehicle_condition AS ENUM ('new','used','certified');
CREATE TYPE public.vehicle_status AS ENUM ('available','pending','sold','draft');
CREATE TYPE public.transmission_type AS ENUM ('automatic','manual','cvt','dct');
CREATE TYPE public.fuel_type AS ENUM ('petrol','diesel','hybrid','electric','plugin_hybrid');
CREATE TYPE public.body_type AS ENUM ('sedan','suv','hatchback','coupe','convertible','wagon','pickup','van','minivan','crossover');
CREATE TYPE public.drivetrain AS ENUM ('fwd','rwd','awd','4wd');
CREATE TYPE public.inquiry_type AS ENUM ('info','test_drive','finance','offer');
CREATE TYPE public.inquiry_status AS ENUM ('new','contacted','closed');
CREATE TYPE public.finance_status AS ENUM ('submitted','reviewing','approved','declined','withdrawn');

-- =========================================================
-- dealers
-- =========================================================
CREATE TABLE public.dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  address text,
  city text,
  region text,
  country text DEFAULT 'Kenya',
  phone text,
  email text,
  website text,
  hours jsonb,
  about text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dealers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealers TO authenticated;
GRANT ALL ON public.dealers TO service_role;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dealers are public" ON public.dealers FOR SELECT USING (true);
CREATE POLICY "Dealer owners manage own dealership" ON public.dealers
  FOR ALL USING (auth.uid() = owner_id OR has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = owner_id OR has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_dealers_updated_at BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- vehicles
-- =========================================================
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  trim text,
  body_type body_type,
  condition vehicle_condition NOT NULL DEFAULT 'used',
  mileage integer DEFAULT 0,
  price numeric NOT NULL,
  msrp numeric,
  fuel_type fuel_type NOT NULL DEFAULT 'petrol',
  transmission transmission_type NOT NULL DEFAULT 'automatic',
  drivetrain drivetrain,
  engine text,
  exterior_color text,
  interior_color text,
  vin text,
  stock_number text,
  photos text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  description text,
  location text,
  status vehicle_status NOT NULL DEFAULT 'draft',
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Available vehicles are public" ON public.vehicles FOR SELECT
  USING (
    status IN ('available','pending','sold')
    OR EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = vehicles.dealer_id AND d.owner_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE POLICY "Dealers insert their vehicles" ON public.vehicles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.owner_id = auth.uid()));
CREATE POLICY "Dealers update their vehicles" ON public.vehicles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.owner_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Dealers delete their vehicles" ON public.vehicles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.dealers d WHERE d.id = dealer_id AND d.owner_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vehicles_dealer ON public.vehicles(dealer_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);

-- =========================================================
-- inquiries
-- =========================================================
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  type inquiry_type NOT NULL DEFAULT 'info',
  preferred_date timestamptz,
  offer_amount numeric,
  status inquiry_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.inquiries TO authenticated;
GRANT INSERT ON public.inquiries TO anon;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an inquiry" ON public.inquiries FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "View own inquiries" ON public.inquiries FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.vehicles v JOIN public.dealers d ON d.id = v.dealer_id
               WHERE v.id = inquiries.vehicle_id AND d.owner_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE POLICY "Dealers update inquiries on their vehicles" ON public.inquiries FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.vehicles v JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = inquiries.vehicle_id AND d.owner_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE TRIGGER trg_inquiries_updated_at BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_inquiries_vehicle ON public.inquiries(vehicle_id);
CREATE INDEX idx_inquiries_user ON public.inquiries(user_id);

-- =========================================================
-- finance_applications
-- =========================================================
CREATE TABLE public.finance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  vehicle_price numeric NOT NULL,
  down_payment numeric NOT NULL DEFAULT 0,
  trade_in_value numeric NOT NULL DEFAULT 0,
  term_months integer NOT NULL,
  apr numeric NOT NULL,
  monthly_payment numeric NOT NULL,
  employer text,
  job_title text,
  annual_income numeric,
  employment_years integer,
  status finance_status NOT NULL DEFAULT 'submitted',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.finance_applications TO authenticated;
GRANT ALL ON public.finance_applications TO service_role;
ALTER TABLE public.finance_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers create their own application" ON public.finance_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "View own finance applications" ON public.finance_applications FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.vehicles v JOIN public.dealers d ON d.id = v.dealer_id
               WHERE v.id = finance_applications.vehicle_id AND d.owner_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE POLICY "Dealers update applications on their vehicles" ON public.finance_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.vehicles v JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = finance_applications.vehicle_id AND d.owner_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE TRIGGER trg_finance_updated_at BEFORE UPDATE ON public.finance_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- vehicle_reviews (expert reviews)
-- =========================================================
CREATE TABLE public.vehicle_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  rating numeric NOT NULL,
  author text NOT NULL,
  pros text[] DEFAULT '{}',
  cons text[] DEFAULT '{}',
  hero_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_reviews TO authenticated;
GRANT ALL ON public.vehicle_reviews TO service_role;
ALTER TABLE public.vehicle_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.vehicle_reviews FOR SELECT USING (true);
CREATE POLICY "Admins write reviews" ON public.vehicle_reviews FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update reviews" ON public.vehicle_reviews FOR UPDATE
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete reviews" ON public.vehicle_reviews FOR DELETE
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_vehicle_reviews_updated_at BEFORE UPDATE ON public.vehicle_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- saved_vehicles (favorites)
-- =========================================================
CREATE TABLE public.saved_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vehicle_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_vehicles TO authenticated;
GRANT ALL ON public.saved_vehicles TO service_role;
ALTER TABLE public.saved_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved vehicles" ON public.saved_vehicles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- comparisons
-- =========================================================
CREATE TABLE public.comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  vehicle_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comparisons TO authenticated;
GRANT ALL ON public.comparisons TO service_role;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comparisons" ON public.comparisons
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
