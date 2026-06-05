REVOKE EXECUTE ON FUNCTION public.notify_booking_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_vehicle_listing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_booking_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_booking_financials() FROM PUBLIC, anon, authenticated;