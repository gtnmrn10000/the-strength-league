-- ============ P0 Moderation ============

-- 1. app_role enum + user_roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles select own" ON public.user_roles;
CREATE POLICY "user_roles select own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'moderator') OR public.has_role(_user_id, 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_moderator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_moderator(uuid) TO authenticated, anon;

-- 2. moderation_actions
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  target_user_id uuid,
  action text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_actions select mods" ON public.moderation_actions;
CREATE POLICY "moderation_actions select mods" ON public.moderation_actions
  FOR SELECT TO authenticated USING (public.is_moderator(auth.uid()));
DROP POLICY IF EXISTS "moderation_actions insert mods" ON public.moderation_actions;
CREATE POLICY "moderation_actions insert mods" ON public.moderation_actions
  FOR INSERT TO authenticated WITH CHECK (public.is_moderator(auth.uid()) AND moderator_id = auth.uid());

CREATE INDEX IF NOT EXISTS moderation_actions_target_idx ON public.moderation_actions(target_type, target_id);

-- 3. content_reports: extend status via validation trigger (not CHECK rewrite) + moderator access
CREATE OR REPLACE FUNCTION public.validate_content_report_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('open','reviewed','actioned','dismissed') THEN
    RAISE EXCEPTION 'status must be open, reviewed, actioned, or dismissed';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS content_reports_status_trg ON public.content_reports;
CREATE TRIGGER content_reports_status_trg
  BEFORE INSERT OR UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_content_report_status();

GRANT UPDATE ON public.content_reports TO authenticated;

DROP POLICY IF EXISTS "reports select own" ON public.content_reports;
DROP POLICY IF EXISTS "reports select mods" ON public.content_reports;
CREATE POLICY "reports select mods" ON public.content_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_moderator(auth.uid()));
DROP POLICY IF EXISTS "reports update mods" ON public.content_reports;
CREATE POLICY "reports update mods" ON public.content_reports
  FOR UPDATE TO authenticated
  USING (public.is_moderator(auth.uid()))
  WITH CHECK (public.is_moderator(auth.uid()));

-- 4. Content hiding columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

-- Posts SELECT: hide hidden content from everyone except owner and moderators
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Posts viewable by authenticated" ON public.posts;
CREATE POLICY "Posts visible unless hidden" ON public.posts
  FOR SELECT TO authenticated
  USING (
    hidden_at IS NULL
    OR auth.uid() = user_id
    OR public.is_moderator(auth.uid())
  );

DROP POLICY IF EXISTS "comments viewable by authenticated" ON public.post_comments;
CREATE POLICY "comments visible unless hidden" ON public.post_comments
  FOR SELECT TO authenticated
  USING (
    hidden_at IS NULL
    OR auth.uid() = user_id
    OR public.is_moderator(auth.uid())
  );

-- 5. Moderation RPCs
CREATE OR REPLACE FUNCTION public.moderate_hide_post(_post_id uuid, _note text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _owner uuid;
BEGIN
  IF NOT public.is_moderator(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT user_id INTO _owner FROM public.posts WHERE id = _post_id;
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'post not found';
  END IF;
  UPDATE public.posts SET hidden_at = now() WHERE id = _post_id;
  INSERT INTO public.moderation_actions (moderator_id, target_type, target_id, target_user_id, action, note)
  VALUES (auth.uid(), 'post', _post_id, _owner, 'hide_post', _note);
END;
$$;
REVOKE ALL ON FUNCTION public.moderate_hide_post(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_hide_post(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.moderate_hide_comment(_comment_id uuid, _note text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _owner uuid;
BEGIN
  IF NOT public.is_moderator(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT user_id INTO _owner FROM public.post_comments WHERE id = _comment_id;
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'comment not found';
  END IF;
  UPDATE public.post_comments SET hidden_at = now() WHERE id = _comment_id;
  INSERT INTO public.moderation_actions (moderator_id, target_type, target_id, target_user_id, action, note)
  VALUES (auth.uid(), 'comment', _comment_id, _owner, 'hide_comment', _note);
END;
$$;
REVOKE ALL ON FUNCTION public.moderate_hide_comment(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_hide_comment(uuid, text) TO authenticated;

-- 6. Block enforcement at DB level: block follow/comment/hype/vote across a block relation
CREATE OR REPLACE FUNCTION public.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;
REVOKE ALL ON FUNCTION public.is_blocked_pair(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_no_block_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_blocked_pair(NEW.follower_id, NEW.following_id) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_no_block_follow_trg ON public.follows;
CREATE TRIGGER enforce_no_block_follow_trg BEFORE INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.enforce_no_block_follow();

CREATE OR REPLACE FUNCTION public.enforce_no_block_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND public.is_blocked_pair(NEW.user_id, _owner) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_no_block_comment_trg ON public.post_comments;
CREATE TRIGGER enforce_no_block_comment_trg BEFORE INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.enforce_no_block_comment();

CREATE OR REPLACE FUNCTION public.enforce_no_block_hype()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND public.is_blocked_pair(NEW.user_id, _owner) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_no_block_hype_trg ON public.post_hypes;
CREATE TRIGGER enforce_no_block_hype_trg BEFORE INSERT ON public.post_hypes
FOR EACH ROW EXECUTE FUNCTION public.enforce_no_block_hype();

CREATE OR REPLACE FUNCTION public.enforce_no_block_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.prs WHERE id = NEW.pr_id;
  IF _owner IS NOT NULL AND public.is_blocked_pair(NEW.user_id, _owner) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_no_block_vote_trg ON public.pr_votes;
CREATE TRIGGER enforce_no_block_vote_trg BEFORE INSERT ON public.pr_votes
FOR EACH ROW EXECUTE FUNCTION public.enforce_no_block_vote();

-- Notifications: also hide notifications where actor is blocked, when read after-the-fact
-- (push_notification already prevents creation; nothing else needed.)

-- 7. Minimal obvious-spam guard at DB level (defense in depth; client also validates)
CREATE OR REPLACE FUNCTION public.is_obvious_spam(_text text)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  t text := coalesce(_text, '');
  c text;
  i int;
  run int;
BEGIN
  IF length(btrim(t)) = 0 THEN RETURN true; END IF;
  IF length(t) > 2000 THEN RETURN true; END IF;
  -- same character repeated more than 15 times in a row
  run := 1;
  FOR i IN 2..length(t) LOOP
    IF substr(t, i, 1) = substr(t, i - 1, 1) THEN
      run := run + 1;
      IF run > 15 THEN RETURN true; END IF;
    ELSE
      run := 1;
    END IF;
  END LOOP;
  -- obvious banned-substance spam URLs / keywords
  IF t ~* '(steroid|sarms?|clenbuterol|dianabol|anabolisant|peptide-shop|hgh-for-sale)\S*\.(com|net|shop|store|xyz|top|biz)' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_post_comment_body()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(btrim(NEW.body)) = 0 THEN
    RAISE EXCEPTION 'comment empty';
  END IF;
  IF length(NEW.body) > 500 THEN
    RAISE EXCEPTION 'comment too long';
  END IF;
  IF public.is_obvious_spam(NEW.body) THEN
    RAISE EXCEPTION 'comment looks like spam';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS validate_post_comment_body_trg ON public.post_comments;
CREATE TRIGGER validate_post_comment_body_trg BEFORE INSERT OR UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.validate_post_comment_body();

CREATE OR REPLACE FUNCTION public.validate_post_caption()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.caption IS NOT NULL THEN
    IF length(NEW.caption) > 2000 THEN
      RAISE EXCEPTION 'caption too long';
    END IF;
    IF public.is_obvious_spam(NEW.caption) THEN
      RAISE EXCEPTION 'caption looks like spam';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS validate_post_caption_trg ON public.posts;
CREATE TRIGGER validate_post_caption_trg BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.validate_post_caption();
