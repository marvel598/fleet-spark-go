
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
-- check_car_availability stays callable: the booking widget invokes it via RPC.
