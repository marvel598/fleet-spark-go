
-- Storage policies for car-photos bucket: restrict writes to authenticated user's folder
CREATE POLICY "Users upload own car-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own car-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'car-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own car-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Trip reviews: hide renter identity from public, expose via safe public view
DROP POLICY IF EXISTS "Trip reviews public" ON public.trip_reviews;

CREATE POLICY "Renter views own trip reviews"
ON public.trip_reviews FOR SELECT
TO authenticated
USING (auth.uid() = renter_id);

CREATE POLICY "Vehicle owners view trip reviews on their vehicles"
ON public.trip_reviews FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.vehicles v
  LEFT JOIN public.dealers d ON d.id = v.dealer_id
  WHERE v.id = trip_reviews.vehicle_id
    AND (v.owner_id = auth.uid() OR d.owner_id = auth.uid())
));

CREATE POLICY "Admins view all trip reviews"
ON public.trip_reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public-safe view exposing trip reviews without renter identity
CREATE OR REPLACE VIEW public.trip_reviews_public
WITH (security_invoker = true) AS
SELECT id, booking_id, vehicle_id, vehicle_rating, owner_rating, comment, created_at
FROM public.trip_reviews;

GRANT SELECT ON public.trip_reviews_public TO anon, authenticated;
