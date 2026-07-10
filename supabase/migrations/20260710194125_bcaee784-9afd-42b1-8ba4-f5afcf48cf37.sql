
-- 1. Restrict column-level SELECT so sensitive health fields are unreachable via the Data API
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, pseudo, bio, avatar_url, cover_url,
  current_grade, xp, posts_count, followers_count, following_count,
  onboarded, is_premium, last_pr_at, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Keep INSERT/UPDATE/DELETE for authenticated (RLS still enforces ownership)
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Drop redundant duplicate SELECT policy (public policy already covers safe columns)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- 3. Security-definer function for the owner to read their full profile including sensitive fields
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
