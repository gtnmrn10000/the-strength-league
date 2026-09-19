-- Sprint social : enregistrements, reposts, commentaires (réponses + likes),
-- posts nutrition typés, et état d'analyse vidéo des PR officiels (squat/bench/deadlift).

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_of uuid REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meal_name text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meal_kcal numeric;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meal_protein_g numeric;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meal_carbs_g numeric;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meal_fat_g numeric;

CREATE INDEX IF NOT EXISTS posts_repost_of_idx ON public.posts (repost_of) WHERE repost_of IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS posts_unique_repost_per_user_idx
  ON public.posts (user_id, repost_of) WHERE repost_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_user_created_idx ON public.posts (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.validate_repost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  root public.posts%ROWTYPE;
BEGIN
  IF NEW.repost_of IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO root FROM public.posts WHERE id = NEW.repost_of;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publication introuvable.';
  END IF;

  IF root.repost_of IS NOT NULL THEN
    NEW.repost_of := root.repost_of;
    SELECT * INTO root FROM public.posts WHERE id = NEW.repost_of;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Publication introuvable.';
    END IF;
  END IF;

  IF root.hidden_at IS NOT NULL THEN
    RAISE EXCEPTION 'Publication indisponible.';
  END IF;

  IF public.is_blocked_pair(NEW.user_id, root.user_id) THEN
    RAISE EXCEPTION 'Interaction impossible avec cet utilisateur.';
  END IF;

  NEW.type := root.type;
  NEW.media_url := NULL;
  NEW.media_type := 'image';
  NEW.muscle_groups := NULL;
  NEW.macros := NULL;
  NEW.pr_id := NULL;
  NEW.meal_name := NULL;
  NEW.meal_kcal := NULL;
  NEW.meal_protein_g := NULL;
  NEW.meal_carbs_g := NULL;
  NEW.meal_fat_g := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_repost_trg ON public.posts;
CREATE TRIGGER validate_repost_trg
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.validate_repost();

CREATE OR REPLACE FUNCTION public.reposts_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.repost_of IS NOT NULL THEN
    UPDATE public.posts SET repost_count = repost_count + 1 WHERE id = NEW.repost_of;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.repost_of IS NOT NULL THEN
    UPDATE public.posts SET repost_count = GREATEST(repost_count - 1, 0) WHERE id = OLD.repost_of;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reposts_counters_trg ON public.posts;
CREATE TRIGGER reposts_counters_trg
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.reposts_counters();

CREATE TABLE IF NOT EXISTS public.post_saves (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

GRANT SELECT, INSERT, DELETE ON public.post_saves TO authenticated;
GRANT ALL ON public.post_saves TO service_role;

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_saves_select_own" ON public.post_saves;
CREATE POLICY "post_saves_select_own" ON public.post_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "post_saves_insert_own" ON public.post_saves;
CREATE POLICY "post_saves_insert_own" ON public.post_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "post_saves_delete_own" ON public.post_saves;
CREATE POLICY "post_saves_delete_own" ON public.post_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_saves_user_created_idx ON public.post_saves (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.rate_limit_post_saves()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.post_saves
    WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';
  IF n >= 200 THEN RAISE EXCEPTION 'Trop d''enregistrements en peu de temps.'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rate_limit_post_saves_trg ON public.post_saves;
CREATE TRIGGER rate_limit_post_saves_trg
BEFORE INSERT ON public.post_saves
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_post_saves();

ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS post_comments_parent_idx ON public.post_comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS post_comments_post_created_idx ON public.post_comments (post_id, created_at);

CREATE OR REPLACE FUNCTION public.normalize_comment_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE parent public.post_comments%ROWTYPE;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO parent FROM public.post_comments WHERE id = NEW.parent_id;
  IF NOT FOUND OR parent.post_id <> NEW.post_id THEN
    RAISE EXCEPTION 'Commentaire parent introuvable.';
  END IF;
  IF parent.parent_id IS NOT NULL THEN
    NEW.parent_id := parent.parent_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_comment_parent_trg ON public.post_comments;
CREATE TRIGGER normalize_comment_parent_trg
BEFORE INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.normalize_comment_parent();

CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes_select_auth" ON public.comment_likes;
CREATE POLICY "comment_likes_select_auth" ON public.comment_likes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "comment_likes_insert_own" ON public.comment_likes;
CREATE POLICY "comment_likes_insert_own" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comment_likes_delete_own" ON public.comment_likes;
CREATE POLICY "comment_likes_delete_own" ON public.comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comment_likes_user_idx ON public.comment_likes (user_id);

CREATE OR REPLACE FUNCTION public.comment_likes_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS comment_likes_counters_trg ON public.comment_likes;
CREATE TRIGGER comment_likes_counters_trg
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.comment_likes_counters();

CREATE OR REPLACE FUNCTION public.enforce_no_block_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.post_comments WHERE id = NEW.comment_id;
  IF _owner IS NOT NULL AND public.is_blocked_pair(NEW.user_id, _owner) THEN
    RAISE EXCEPTION 'Interaction impossible avec cet utilisateur.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_no_block_comment_like_trg ON public.comment_likes;
CREATE TRIGGER enforce_no_block_comment_like_trg
BEFORE INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.enforce_no_block_comment_like();

ALTER TABLE public.prs ADD COLUMN IF NOT EXISTS lift text;
ALTER TABLE public.prs ADD COLUMN IF NOT EXISTS ai_status text NOT NULL DEFAULT 'unavailable';
ALTER TABLE public.prs ADD COLUMN IF NOT EXISTS ai_result jsonb;
ALTER TABLE public.prs ADD COLUMN IF NOT EXISTS ai_checked_at timestamptz;

UPDATE public.prs SET lift = CASE
  WHEN exercise IN ('squat', 'back-squat', 'barbell-squat') THEN 'squat'
  WHEN exercise IN ('bench-press', 'developpe-couche', 'barbell-bench-press') THEN 'bench'
  WHEN exercise IN ('deadlift', 'souleve-de-terre') THEN 'deadlift'
  ELSE NULL END
WHERE lift IS NULL;

CREATE OR REPLACE FUNCTION public.guard_pr_ai_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
BEGIN
  IF NEW.lift IS NOT NULL AND NEW.lift NOT IN ('squat', 'bench', 'deadlift') THEN
    RAISE EXCEPTION 'lift must be squat, bench or deadlift';
  END IF;
  IF NEW.ai_status NOT IN ('unavailable', 'queued', 'passed', 'failed') THEN
    RAISE EXCEPTION 'invalid ai_status';
  END IF;
  IF jwt_role IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.ai_status := 'unavailable';
      NEW.ai_result := NULL;
      NEW.ai_checked_at := NULL;
    ELSE
      NEW.ai_status := OLD.ai_status;
      NEW.ai_result := OLD.ai_result;
      NEW.ai_checked_at := OLD.ai_checked_at;
      NEW.lift := OLD.lift;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_pr_ai_columns_trg ON public.prs;
CREATE TRIGGER guard_pr_ai_columns_trg
BEFORE INSERT OR UPDATE ON public.prs
FOR EACH ROW EXECUTE FUNCTION public.guard_pr_ai_columns();