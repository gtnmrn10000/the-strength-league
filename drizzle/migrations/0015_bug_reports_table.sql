CREATE TABLE IF NOT EXISTS public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL DEFAULT 'bug',
  message text NOT NULL,
  app_version text,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bug_reports TO authenticated;
GRANT ALL ON public.bug_reports TO service_role;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bug_reports insert own" ON public.bug_reports;
CREATE POLICY "bug_reports insert own" ON public.bug_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bug_reports select own" ON public.bug_reports;
CREATE POLICY "bug_reports select own" ON public.bug_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS bug_reports_user_idx ON public.bug_reports (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.rate_limit_bug_reports()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.bug_reports
    WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';
  IF n >= 10 THEN RAISE EXCEPTION 'Trop de rapports envoyés. Réessaie plus tard.'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS rate_limit_bug_reports_trg ON public.bug_reports;
CREATE TRIGGER rate_limit_bug_reports_trg BEFORE INSERT ON public.bug_reports
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_bug_reports();