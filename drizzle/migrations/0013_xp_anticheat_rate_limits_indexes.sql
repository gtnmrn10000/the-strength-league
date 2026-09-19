-- 1. xp_events : plus aucune écriture client (service role uniquement)
DROP POLICY IF EXISTS "xp_events insert own" ON public.xp_events;
DROP POLICY IF EXISTS "Users insert own xp events" ON public.xp_events;
DROP POLICY IF EXISTS "xp events insert own" ON public.xp_events;
REVOKE INSERT, UPDATE, DELETE ON public.xp_events FROM authenticated, anon;
GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;

ALTER TABLE public.xp_events ADD COLUMN IF NOT EXISTS ref_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS xp_events_ref_unique
  ON public.xp_events (user_id, kind, ref_id) WHERE ref_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS xp_events_user_kind_day_idx
  ON public.xp_events (user_id, kind, day DESC);

-- 2. Grade dérivé du XP réel
CREATE OR REPLACE FUNCTION public.grade_for_xp(_xp integer)
RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  SELECT CASE
    WHEN _xp >= 15000 THEN 'divin'
    WHEN _xp >= 10500 THEN 'legende'
    WHEN _xp >= 7000  THEN 'titan'
    WHEN _xp >= 4500  THEN 'centurion'
    WHEN _xp >= 2800  THEN 'gladiateur'
    WHEN _xp >= 1600  THEN 'spartiate'
    WHEN _xp >= 800   THEN 'guerrier'
    WHEN _xp >= 300   THEN 'soldat'
    ELSE 'recruit'
  END;
$$;

-- 3. Les clients ne peuvent plus modifier xp / current_grade ; le grade suit toujours le XP
CREATE OR REPLACE FUNCTION public.guard_progression_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
BEGIN
  IF jwt_role IN ('anon', 'authenticated') THEN
    NEW.xp := OLD.xp;
  END IF;
  NEW.current_grade := public.grade_for_xp(coalesce(NEW.xp, 0));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_progression_columns_trg ON public.profiles;
CREATE TRIGGER guard_progression_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_progression_columns();

CREATE OR REPLACE FUNCTION public.sync_grade_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
BEGIN
  IF jwt_role IN ('anon', 'authenticated') THEN
    NEW.xp := 0;
  END IF;
  NEW.current_grade := public.grade_for_xp(coalesce(NEW.xp, 0));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_grade_on_insert_trg ON public.profiles;
CREATE TRIGGER sync_grade_on_insert_trg
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_grade_on_insert();

-- 4. Limites anti-spam simples
CREATE OR REPLACE FUNCTION public.rate_limit_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF TG_TABLE_NAME = 'post_comments' THEN
    SELECT count(*) INTO n FROM public.post_comments
      WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';
    IF n >= 20 THEN RAISE EXCEPTION 'Trop de commentaires en peu de temps. Réessaie plus tard.'; END IF;
  ELSIF TG_TABLE_NAME = 'posts' THEN
    SELECT count(*) INTO n FROM public.posts
      WHERE user_id = NEW.user_id AND created_at > now() - interval '1 day';
    IF n >= 20 THEN RAISE EXCEPTION 'Limite de publications atteinte pour aujourd''hui.'; END IF;
  ELSIF TG_TABLE_NAME = 'follows' THEN
    SELECT count(*) INTO n FROM public.follows
      WHERE follower_id = NEW.follower_id AND created_at > now() - interval '1 day';
    IF n >= 200 THEN RAISE EXCEPTION 'Limite d''abonnements atteinte pour aujourd''hui.'; END IF;
  ELSIF TG_TABLE_NAME = 'pr_votes' THEN
    SELECT count(*) INTO n FROM public.pr_votes
      WHERE user_id = NEW.user_id AND created_at > now() - interval '1 day';
    IF n >= 60 THEN RAISE EXCEPTION 'Limite de votes atteinte pour aujourd''hui.'; END IF;
  ELSIF TG_TABLE_NAME = 'content_reports' THEN
    SELECT count(*) INTO n FROM public.content_reports
      WHERE reporter_id = NEW.reporter_id AND created_at > now() - interval '1 day';
    IF n >= 10 THEN RAISE EXCEPTION 'Limite de signalements atteinte pour aujourd''hui.'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rate_limit_comments_trg ON public.post_comments;
CREATE TRIGGER rate_limit_comments_trg BEFORE INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_guard();
DROP TRIGGER IF EXISTS rate_limit_posts_trg ON public.posts;
CREATE TRIGGER rate_limit_posts_trg BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_guard();
DROP TRIGGER IF EXISTS rate_limit_follows_trg ON public.follows;
CREATE TRIGGER rate_limit_follows_trg BEFORE INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_guard();
DROP TRIGGER IF EXISTS rate_limit_votes_trg ON public.pr_votes;
CREATE TRIGGER rate_limit_votes_trg BEFORE INSERT ON public.pr_votes
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_guard();
DROP TRIGGER IF EXISTS rate_limit_reports_trg ON public.content_reports;
CREATE TRIGGER rate_limit_reports_trg BEFORE INSERT ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_guard();

-- 5. Index manquants sur colonnes filtrées / RLS
CREATE INDEX IF NOT EXISTS content_reports_reporter_idx ON public.content_reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_comments_user_idx ON public.post_comments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_created_idx ON public.posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pr_votes_user_idx ON public.pr_votes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS prs_user_created_idx ON public.prs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workout_sessions_user_completed_idx ON public.workout_sessions (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS food_logs_user_logged_idx ON public.food_logs (user_id, logged_at DESC);