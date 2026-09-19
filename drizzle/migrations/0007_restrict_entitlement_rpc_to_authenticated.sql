-- get_my_entitlement ne doit pas être appelable sans être connecté.
REVOKE EXECUTE ON FUNCTION public.get_my_entitlement() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_entitlement() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_entitlement() TO authenticated;