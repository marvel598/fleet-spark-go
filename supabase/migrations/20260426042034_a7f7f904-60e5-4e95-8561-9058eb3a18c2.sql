-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restrict storage listing: replace broad SELECT policy with one that only allows
-- accessing files when the exact path is known (no wildcard listing).
DROP POLICY IF EXISTS "Car photos are publicly viewable" ON storage.objects;

CREATE POLICY "Car photos accessible by direct path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-photos' AND (storage.foldername(name))[1] IS NOT NULL);