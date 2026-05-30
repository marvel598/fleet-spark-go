
-- Drop the older permissive storage policies that only checked the first path segment.
-- The stricter authenticated-role policies (joining public.cars) remain in place.
DROP POLICY IF EXISTS "Users can upload car photos to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own car photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own car photos" ON storage.objects;
