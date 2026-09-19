CREATE OR REPLACE FUNCTION public.get_xp_leaderboard(_grade text DEFAULT NULL, _limit integer DEFAULT 30, _offset integer DEFAULT 0)
RETURNS TABLE(user_id uuid, pseudo text, avatar_url text, current_grade text, xp integer, global_rank integer, grade_rank integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT p.user_id,
           p.pseudo,
           p.avatar_url,
           p.current_grade,
           p.xp,
           RANK() OVER (ORDER BY p.xp DESC, p.created_at ASC)::integer AS global_rank,
           RANK() OVER (PARTITION BY p.current_grade ORDER BY p.xp DESC, p.created_at ASC)::integer AS grade_rank
    FROM public.profiles p
  )
  SELECT r.user_id, r.pseudo, r.avatar_url, r.current_grade, r.xp, r.global_rank, r.grade_rank
  FROM ranked r
  WHERE auth.uid() IS NOT NULL
    AND (_grade IS NULL OR r.current_grade = _grade)
  ORDER BY CASE WHEN _grade IS NULL THEN r.global_rank ELSE r.grade_rank END, r.user_id
  LIMIT GREATEST(1, LEAST(_limit, 100))
  OFFSET GREATEST(0, _offset);
$$;

REVOKE ALL ON FUNCTION public.get_xp_leaderboard(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_xp_leaderboard(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_xp_leaderboard(text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_xp_ranks()
RETURNS TABLE(global_rank integer, global_participants integer, grade_rank integer, grade_participants integer, current_grade text, xp integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT p.user_id,
           p.current_grade,
           p.xp,
           RANK() OVER (ORDER BY p.xp DESC, p.created_at ASC)::integer AS global_rank,
           COUNT(*) OVER ()::integer AS global_participants,
           RANK() OVER (PARTITION BY p.current_grade ORDER BY p.xp DESC, p.created_at ASC)::integer AS grade_rank,
           COUNT(*) OVER (PARTITION BY p.current_grade)::integer AS grade_participants
    FROM public.profiles p
  )
  SELECT r.global_rank, r.global_participants, r.grade_rank, r.grade_participants, r.current_grade, r.xp
  FROM ranked r
  WHERE r.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_xp_ranks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_xp_ranks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_xp_ranks() TO service_role;