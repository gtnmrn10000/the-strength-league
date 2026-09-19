-- Comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments viewable by authenticated" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments insert own" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND length(btrim(body)) > 0);
CREATE POLICY "comments delete own" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX post_comments_post_idx ON public.post_comments(post_id, created_at DESC);
CREATE INDEX post_comments_user_idx ON public.post_comments(user_id);

ALTER TABLE public.posts ADD COLUMN comment_count integer NOT NULL DEFAULT 0;

-- Blocks
CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks select own" ON public.user_blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "blocks insert own" ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);
CREATE POLICY "blocks delete own" ON public.user_blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);
CREATE INDEX user_blocks_blocked_idx ON public.user_blocks(blocked_id);

-- Reports
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  target_user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports select own" ON public.content_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "reports insert own" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND target_type IN ('post','profile','comment') AND status = 'open');
CREATE INDEX content_reports_status_idx ON public.content_reports(status, created_at DESC);
CREATE INDEX content_reports_target_idx ON public.content_reports(target_type, target_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  post_id uuid,
  pr_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications select own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications delete own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

-- Helper: insert a notification (bypasses RLS, ignores self-notifications when actor = user)
CREATE OR REPLACE FUNCTION public.push_notification(
  _user_id uuid, _actor_id uuid, _type text, _post_id uuid, _pr_id uuid, _meta jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  IF _actor_id IS NOT NULL AND _actor_id = _user_id THEN RETURN; END IF;
  IF _actor_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _user_id AND blocked_id = _actor_id)
       OR (blocker_id = _actor_id AND blocked_id = _user_id)
  ) THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, post_id, pr_id, meta)
  VALUES (_user_id, _actor_id, _type, _post_id, _pr_id, COALESCE(_meta, '{}'::jsonb));
END; $$;
REVOKE ALL ON FUNCTION public.push_notification(uuid, uuid, text, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;

-- Comment counters + notification
CREATE OR REPLACE FUNCTION public.comments_counters() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id
      RETURNING user_id INTO owner_id;
    PERFORM public.push_notification(owner_id, NEW.user_id, 'comment', NEW.post_id, NULL,
      jsonb_build_object('preview', left(NEW.body, 80)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER comments_counters_trg AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.comments_counters();

-- Follow notification
CREATE OR REPLACE FUNCTION public.notify_follow() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.push_notification(NEW.following_id, NEW.follower_id, 'follow', NULL, NULL, '{}'::jsonb);
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_follow_trg AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

-- Hype notification
CREATE OR REPLACE FUNCTION public.notify_hype() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.posts WHERE id = NEW.post_id;
  PERFORM public.push_notification(owner_id, NEW.user_id, 'hype', NEW.post_id, NULL, '{}'::jsonb);
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_hype_trg AFTER INSERT ON public.post_hypes
FOR EACH ROW EXECUTE FUNCTION public.notify_hype();

-- PR vote notification
CREATE OR REPLACE FUNCTION public.notify_pr_vote() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.prs WHERE id = NEW.pr_id;
  PERFORM public.push_notification(owner_id, NEW.user_id, 'pr_vote', NULL, NEW.pr_id,
    jsonb_build_object('vote', NEW.vote));
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_pr_vote_trg AFTER INSERT ON public.pr_votes
FOR EACH ROW EXECUTE FUNCTION public.notify_pr_vote();

-- PR status notification
CREATE OR REPLACE FUNCTION public.notify_pr_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('verified','contested') THEN
    PERFORM public.push_notification(NEW.user_id, NULL, 'pr_' || NEW.status, NULL, NEW.id,
      jsonb_build_object('exercise', NEW.exercise, 'weight_kg', NEW.weight_kg));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_pr_status_trg AFTER UPDATE ON public.prs
FOR EACH ROW EXECUTE FUNCTION public.notify_pr_status();

-- Grade change notification
CREATE OR REPLACE FUNCTION public.notify_grade_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_grade IS DISTINCT FROM OLD.current_grade THEN
    PERFORM public.push_notification(NEW.user_id, NULL, 'grade_up', NULL, NULL,
      jsonb_build_object('grade', NEW.current_grade, 'previous', OLD.current_grade));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_grade_change_trg AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_grade_change();

-- Pseudo search index
CREATE INDEX profiles_pseudo_lower_idx ON public.profiles(lower(pseudo));