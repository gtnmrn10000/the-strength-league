
-- 1. Restrict SELECT on user-facing tables to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts viewable by authenticated" ON public.posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows viewable by authenticated" ON public.follows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hypes are viewable by everyone" ON public.post_hypes;
CREATE POLICY "Hypes viewable by authenticated" ON public.post_hypes
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.posts FROM anon;
REVOKE SELECT ON public.follows FROM anon;
REVOKE SELECT ON public.post_hypes FROM anon;

-- 2. Block anonymous-signed-in users from workout_sessions
DROP POLICY IF EXISTS "workout_sessions owner select" ON public.workout_sessions;
DROP POLICY IF EXISTS "workout_sessions owner insert" ON public.workout_sessions;
DROP POLICY IF EXISTS "workout_sessions owner update" ON public.workout_sessions;
DROP POLICY IF EXISTS "workout_sessions owner delete" ON public.workout_sessions;

CREATE POLICY "workout_sessions owner select" ON public.workout_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE);
CREATE POLICY "workout_sessions owner insert" ON public.workout_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE);
CREATE POLICY "workout_sessions owner update" ON public.workout_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE)
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE);
CREATE POLICY "workout_sessions owner delete" ON public.workout_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE);

-- 3. Lock down SECURITY DEFINER trigger-only functions (only the DB engine
-- should invoke them; nothing in the client or PostgREST needs EXECUTE)
REVOKE EXECUTE ON FUNCTION public.validate_prs_row()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.follows_counters()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.posts_counters()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hypes_counters()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_coach_role()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pr_vote()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_post_pr()           FROM PUBLIC, anon, authenticated;

-- 4. Callable RPCs: revoke anon, keep authenticated only
REVOKE EXECUTE ON FUNCTION public.get_my_profile()           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_premium()  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_profile()           TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_current_user_premium()  TO authenticated;
