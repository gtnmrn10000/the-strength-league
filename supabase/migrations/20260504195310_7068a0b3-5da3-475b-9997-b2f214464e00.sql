
ALTER TABLE public.prs
ADD COLUMN IF NOT EXISTS hype_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_pr_at timestamptz;
