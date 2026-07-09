
-- 1. Drop league from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS league;
DROP TYPE IF EXISTS public.league_type;

-- 2. Extend profiles with social fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS posts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

-- Allow public read of profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.profiles TO anon;

-- 3. post_type enum
DO $$ BEGIN
  CREATE TYPE public.post_type AS ENUM ('pr','meal','workout','level_up');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.post_type NOT NULL,
  media_url text,
  caption text,
  muscle_groups text[],
  macros jsonb,
  pr_id uuid REFERENCES public.prs(id) ON DELETE SET NULL,
  hype_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts"
  ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own follows"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);
CREATE POLICY "Users delete own follows"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- 6. post_hypes table
CREATE TABLE IF NOT EXISTS public.post_hypes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS post_hypes_user_idx ON public.post_hypes(user_id);

GRANT SELECT ON public.post_hypes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_hypes TO authenticated;
GRANT ALL ON public.post_hypes TO service_role;

ALTER TABLE public.post_hypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hypes are viewable by everyone"
  ON public.post_hypes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own hypes"
  ON public.post_hypes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own hypes"
  ON public.post_hypes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 7. Triggers to maintain counters
CREATE OR REPLACE FUNCTION public.follows_counters()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS follows_counters_trg ON public.follows;
CREATE TRIGGER follows_counters_trg
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.follows_counters();

CREATE OR REPLACE FUNCTION public.posts_counters()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS posts_counters_trg ON public.posts;
CREATE TRIGGER posts_counters_trg
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_counters();

CREATE OR REPLACE FUNCTION public.hypes_counters()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET hype_count = hype_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET hype_count = GREATEST(hype_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS hypes_counters_trg ON public.post_hypes;
CREATE TRIGGER hypes_counters_trg
  AFTER INSERT OR DELETE ON public.post_hypes
  FOR EACH ROW EXECUTE FUNCTION public.hypes_counters();
