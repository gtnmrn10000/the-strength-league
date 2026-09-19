CREATE INDEX IF NOT EXISTS prs_user_status_idx ON public.prs (user_id, status);
CREATE INDEX IF NOT EXISTS prs_status_exercise_idx ON public.prs (status, exercise);

-- Classement réel : meilleur PR vérifié par exercice, total des 3 mouvements.
-- SECURITY DEFINER pour n'exposer que des colonnes publiques sûres
-- (pseudo, avatar, grade, xp, total vérifié) — jamais le poids ni l'âge.
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  pseudo text,
  avatar_url text,
  current_grade text,
  xp integer,
  verified_total numeric,
  verified_prs integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH best AS (
    SELECT p.user_id, p.exercise, MAX(p.weight_kg) AS best_kg
    FROM public.prs p
    WHERE p.status = 'verified'
    GROUP BY p.user_id, p.exercise
  ), agg AS (
    SELECT b.user_id, SUM(b.best_kg) AS total_kg, COUNT(*)::int AS n_prs
    FROM best b
    GROUP BY b.user_id
  )
  SELECT pr.user_id,
         pr.pseudo,
         pr.avatar_url,
         pr.current_grade,
         pr.xp,
         COALESCE(a.total_kg, 0)::numeric,
         COALESCE(a.n_prs, 0)::int
  FROM public.profiles pr
  JOIN agg a ON a.user_id = pr.user_id
  WHERE auth.uid() IS NOT NULL
  ORDER BY a.total_kg DESC, pr.xp DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;

-- Position de l'utilisateur courant + nombre total de participants classés.
CREATE OR REPLACE FUNCTION public.get_my_rank()
RETURNS TABLE (rank integer, participants integer, total_kg numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH best AS (
    SELECT p.user_id, p.exercise, MAX(p.weight_kg) AS best_kg
    FROM public.prs p
    WHERE p.status = 'verified'
    GROUP BY p.user_id, p.exercise
  ), agg AS (
    SELECT b.user_id, SUM(b.best_kg) AS total_kg
    FROM best b
    GROUP BY b.user_id
  ), ranked AS (
    SELECT a.user_id,
           a.total_kg,
           RANK() OVER (ORDER BY a.total_kg DESC)::int AS rnk,
           COUNT(*) OVER ()::int AS participants
    FROM agg a
  )
  SELECT r.rnk, r.participants, r.total_kg
  FROM ranked r
  WHERE r.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_rank() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_rank() TO authenticated;