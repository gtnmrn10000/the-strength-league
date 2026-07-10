
-- Restrict Data-API SELECT on profiles to non-sensitive columns only.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, pseudo, bio, avatar_url, cover_url,
  current_grade, xp, last_pr_at,
  posts_count, followers_count, following_count,
  onboarded, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Keep INSERT/UPDATE for owner (RLS already scopes rows to auth.uid()).
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Sensitive columns (age, poids, taille, sexe, niveau_activite, goal, is_premium)
-- are readable only through get_my_profile() which filters by auth.uid().

-- Helper RPC to expose only is_premium of the caller for gating premium features.
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_premium FROM public.profiles WHERE user_id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_premium() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_premium() TO authenticated, service_role;
