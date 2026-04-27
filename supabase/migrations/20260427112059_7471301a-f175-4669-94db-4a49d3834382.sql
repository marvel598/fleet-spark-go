REVOKE EXECUTE ON FUNCTION public.check_car_availability(UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_car_availability(UUID, DATE, DATE) TO authenticated;