-- CENTURIA: xp_events (garde-fous anti-spam XP) + backfill current_grade depuis l'XP réel.

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount integer NOT NULL,
  day date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, day)
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_events owner select" ON public.xp_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE);
CREATE POLICY "xp_events owner insert" ON public.xp_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) IS FALSE);

GRANT SELECT, INSERT ON public.xp_events TO authenticated;
REVOKE ALL ON public.xp_events FROM anon;

-- Backfill : recalcule current_grade depuis l'XP existant (aucune perte
-- d'XP, seule la colonne current_grade est réalignée sur les nouveaux
-- seuils centralisés dans src/lib/grades.ts::GRADE_XP).
UPDATE public.profiles
SET current_grade = CASE
  WHEN xp >= 15000 THEN 'divin'
  WHEN xp >= 10500 THEN 'legende'
  WHEN xp >= 7000  THEN 'titan'
  WHEN xp >= 4500  THEN 'centurion'
  WHEN xp >= 2800  THEN 'gladiateur'
  WHEN xp >= 1600  THEN 'spartiate'
  WHEN xp >= 800   THEN 'guerrier'
  WHEN xp >= 300   THEN 'soldat'
  ELSE 'recruit'
END
WHERE current_grade IS DISTINCT FROM (CASE
  WHEN xp >= 15000 THEN 'divin'
  WHEN xp >= 10500 THEN 'legende'
  WHEN xp >= 7000  THEN 'titan'
  WHEN xp >= 4500  THEN 'centurion'
  WHEN xp >= 2800  THEN 'gladiateur'
  WHEN xp >= 1600  THEN 'spartiate'
  WHEN xp >= 800   THEN 'guerrier'
  WHEN xp >= 300   THEN 'soldat'
  ELSE 'recruit'
END);
