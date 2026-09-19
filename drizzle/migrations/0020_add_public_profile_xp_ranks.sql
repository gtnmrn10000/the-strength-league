CREATE OR REPLACE FUNCTION public.get_user_xp_ranks(_user_id uuid)
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
  WHERE auth.uid() IS NOT NULL AND r.user_id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.get_user_xp_ranks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_xp_ranks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_xp_ranks(uuid) TO service_role;