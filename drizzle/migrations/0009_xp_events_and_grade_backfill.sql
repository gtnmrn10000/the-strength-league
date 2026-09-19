-- Événements XP réels (idempotence par jour) — base du système de grades.
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, day)
);

GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_events_select_own" ON public.xp_events;
CREATE POLICY "xp_events_select_own" ON public.xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "xp_events_insert_own" ON public.xp_events;
CREATE POLICY "xp_events_insert_own" ON public.xp_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS xp_events_user_day_idx ON public.xp_events (user_id, day DESC);

-- Backfill : le grade dérive désormais du XP réel, sans perdre d'XP.
UPDATE public.profiles
SET current_grade = CASE
  WHEN xp >= 15000 THEN 'divin'
  WHEN xp >= 10500 THEN 'legende'
  WHEN xp >= 7000 THEN 'titan'
  WHEN xp >= 4500 THEN 'centurion'
  WHEN xp >= 2800 THEN 'gladiateur'
  WHEN xp >= 1600 THEN 'spartiate'
  WHEN xp >= 800 THEN 'guerrier'
  WHEN xp >= 300 THEN 'soldat'
  ELSE 'recruit'
END;