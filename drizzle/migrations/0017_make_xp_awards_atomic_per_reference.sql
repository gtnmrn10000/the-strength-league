ALTER TABLE public.xp_events
  DROP CONSTRAINT IF EXISTS xp_events_user_id_kind_day_key;

CREATE UNIQUE INDEX IF NOT EXISTS xp_events_legacy_day_unique
  ON public.xp_events (user_id, kind, day)
  WHERE ref_id IS NULL;

CREATE OR REPLACE FUNCTION public.record_xp_event(
  _user_id uuid,
  _kind text,
  _amount integer,
  _day date,
  _ref_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
  previous_xp integer;
  previous_grade text;
  next_xp integer;
  next_grade text;
  grade_ref uuid;
BEGIN
  IF _user_id IS NULL OR _ref_id IS NULL OR _kind IS NULL OR btrim(_kind) = '' THEN
    RAISE EXCEPTION 'XP event requires user, kind and reference';
  END IF;
  IF _amount < 0 THEN
    RAISE EXCEPTION 'XP amount cannot be negative';
  END IF;

  SELECT coalesce(xp, 0), coalesce(current_grade, 'recruit')
    INTO previous_xp, previous_grade
    FROM public.profiles
    WHERE user_id = _user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  INSERT INTO public.xp_events (user_id, kind, amount, day, ref_id)
  VALUES (_user_id, _kind, _amount, _day, _ref_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    RETURN false;
  END IF;

  next_xp := previous_xp + _amount;
  next_grade := public.grade_for_xp(next_xp);

  UPDATE public.profiles
    SET xp = next_xp,
        current_grade = next_grade,
        updated_at = now()
    WHERE user_id = _user_id;

  IF next_grade IS DISTINCT FROM previous_grade THEN
    grade_ref := (
      substr(md5('centuria-grade:' || next_grade), 1, 8) || '-' ||
      substr(md5('centuria-grade:' || next_grade), 9, 4) || '-' ||
      substr(md5('centuria-grade:' || next_grade), 13, 4) || '-' ||
      substr(md5('centuria-grade:' || next_grade), 17, 4) || '-' ||
      substr(md5('centuria-grade:' || next_grade), 21, 12)
    )::uuid;
    INSERT INTO public.xp_events (user_id, kind, amount, day, ref_id)
    VALUES (_user_id, 'grade_unlocked', 0, _day, grade_ref)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_xp_event(uuid, text, integer, date, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_xp_event(uuid, text, integer, date, uuid) TO service_role;