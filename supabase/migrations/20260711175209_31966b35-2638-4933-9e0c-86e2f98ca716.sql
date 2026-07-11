CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- QA/preview override: every authenticated user is treated as premium
  -- so testers can exercise the full app without hitting the paywall.
  SELECT auth.uid() IS NOT NULL;
$$;