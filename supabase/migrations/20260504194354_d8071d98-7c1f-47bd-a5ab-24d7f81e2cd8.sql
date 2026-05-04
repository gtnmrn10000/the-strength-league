
-- Create prs table
CREATE TABLE public.prs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise text NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  reps int NOT NULL DEFAULT 1,
  video_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add check constraints via triggers (avoid immutable CHECK issues)
CREATE OR REPLACE FUNCTION public.validate_prs_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.exercise NOT IN ('squat', 'bench', 'deadlift') THEN
    RAISE EXCEPTION 'exercise must be squat, bench, or deadlift';
  END IF;
  IF NEW.status NOT IN ('pending', 'verified', 'rejected', 'suspect') THEN
    RAISE EXCEPTION 'status must be pending, verified, rejected, or suspect';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_prs
BEFORE INSERT OR UPDATE ON public.prs
FOR EACH ROW EXECUTE FUNCTION public.validate_prs_row();

-- Enable RLS
ALTER TABLE public.prs ENABLE ROW LEVEL SECURITY;

-- Users can read verified PRs or their own PRs
CREATE POLICY "Users can read verified or own PRs"
ON public.prs FOR SELECT
TO authenticated
USING (status = 'verified' OR auth.uid() = user_id);

-- Users can insert their own PRs
CREATE POLICY "Users can insert own PRs"
ON public.prs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own PRs
CREATE POLICY "Users can update own PRs"
ON public.prs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for PR videos
INSERT INTO storage.buckets (id, name, public) VALUES ('pr-videos', 'pr-videos', true);

-- Storage policies
CREATE POLICY "PR videos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'pr-videos');

CREATE POLICY "Authenticated users can upload PR videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pr-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
