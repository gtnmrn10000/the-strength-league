
-- 1. Extend allowed pr status values
CREATE OR REPLACE FUNCTION public.validate_prs_row()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.exercise NOT IN ('squat', 'bench', 'deadlift') THEN
    RAISE EXCEPTION 'exercise must be squat, bench, or deadlift';
  END IF;
  IF NEW.status NOT IN ('pending', 'verified', 'rejected', 'suspect', 'contested') THEN
    RAISE EXCEPTION 'status must be pending, verified, rejected, suspect, or contested';
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Widen prs SELECT so the community can see & vote on pending PRs
DROP POLICY IF EXISTS "Users can read verified or own PRs" ON public.prs;
CREATE POLICY "Authenticated users can read PRs"
  ON public.prs FOR SELECT
  TO authenticated
  USING (true);

-- 3. pr_votes table
CREATE TABLE public.pr_votes (
  pr_id uuid NOT NULL REFERENCES public.prs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pr_id, user_id)
);

CREATE INDEX pr_votes_pr_idx ON public.pr_votes (pr_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_votes TO authenticated;
GRANT ALL ON public.pr_votes TO service_role;

ALTER TABLE public.pr_votes ENABLE ROW LEVEL SECURITY;

-- Validation trigger: vote value + no self-vote
CREATE OR REPLACE FUNCTION public.validate_pr_vote()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  pr_owner uuid;
BEGIN
  IF NEW.vote NOT IN ('valid', 'doubt') THEN
    RAISE EXCEPTION 'vote must be valid or doubt';
  END IF;
  SELECT user_id INTO pr_owner FROM public.prs WHERE id = NEW.pr_id;
  IF pr_owner IS NULL THEN
    RAISE EXCEPTION 'pr not found';
  END IF;
  IF pr_owner = NEW.user_id THEN
    RAISE EXCEPTION 'cannot vote on your own PR';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pr_vote
  BEFORE INSERT OR UPDATE ON public.pr_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_pr_vote();

CREATE POLICY "Votes viewable by authenticated"
  ON public.pr_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users insert own votes"
  ON public.pr_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own votes"
  ON public.pr_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own votes"
  ON public.pr_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Auto-create a feed post when a PR is inserted
CREATE OR REPLACE FUNCTION public.auto_post_pr()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.posts (user_id, type, media_url, pr_id)
  VALUES (NEW.user_id, 'pr', NEW.video_url, NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_post_pr
  AFTER INSERT ON public.prs
  FOR EACH ROW EXECUTE FUNCTION public.auto_post_pr();
