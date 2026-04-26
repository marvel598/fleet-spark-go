-- Enum for application roles
CREATE TYPE public.app_role AS ENUM ('renter', 'owner', 'driver', 'admin');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles table (separate to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cars table
CREATE TYPE public.car_status AS ENUM ('draft', 'active', 'paused');
CREATE TYPE public.transmission_type AS ENUM ('automatic', 'manual');
CREATE TYPE public.fuel_type AS ENUM ('petrol', 'diesel', 'hybrid', 'electric');

CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT,
  transmission transmission_type NOT NULL DEFAULT 'automatic',
  fuel_type fuel_type NOT NULL DEFAULT 'petrol',
  seats INTEGER NOT NULL DEFAULT 5,
  daily_price NUMERIC(10,2) NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  status car_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active cars are viewable by everyone"
  ON public.cars FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert their own cars"
  ON public.cars FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own cars"
  ON public.cars FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their own cars"
  ON public.cars FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default renter role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Always grant renter role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'renter');

  -- If signup metadata requests an additional role (owner/driver), grant it
  selected_role := NULLIF(NEW.raw_user_meta_data ->> 'role', '')::app_role;
  IF selected_role IS NOT NULL AND selected_role IN ('owner', 'driver') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, selected_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for car photos
INSERT INTO storage.buckets (id, name, public) VALUES ('car-photos', 'car-photos', true);

CREATE POLICY "Car photos are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'car-photos');

CREATE POLICY "Users can upload car photos to their folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'car-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own car photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'car-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own car photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'car-photos' AND auth.uid()::text = (storage.foldername(name))[1]);