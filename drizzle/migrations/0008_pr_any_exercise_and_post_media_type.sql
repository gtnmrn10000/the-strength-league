-- PR sur n'importe quel exercice de la bibliothèque (compatibilité ascendante :
-- les anciennes valeurs squat/bench/deadlift restent valides).
ALTER TABLE public.prs ADD COLUMN IF NOT EXISTS exercise_id text;
ALTER TABLE public.prs ADD COLUMN IF NOT EXISTS exercise_name text;

UPDATE public.prs
SET exercise_id = COALESCE(exercise_id, exercise),
    exercise_name = COALESCE(
      exercise_name,
      CASE exercise
        WHEN 'squat' THEN 'Squat barre'
        WHEN 'bench' THEN 'Développé couché barre'
        WHEN 'deadlift' THEN 'Soulevé de terre'
        ELSE exercise
      END)
WHERE exercise_id IS NULL OR exercise_name IS NULL;

CREATE OR REPLACE FUNCTION public.validate_prs_row()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.exercise IS NULL OR length(btrim(NEW.exercise)) = 0 OR length(NEW.exercise) > 80 THEN
    RAISE EXCEPTION 'exercise must be a non-empty name (max 80 chars)';
  END IF;
  IF NEW.exercise_name IS NOT NULL AND length(NEW.exercise_name) > 80 THEN
    RAISE EXCEPTION 'exercise_name too long';
  END IF;
  IF NEW.status NOT IN ('pending', 'verified', 'rejected', 'suspect', 'contested') THEN
    RAISE EXCEPTION 'status must be pending, verified, rejected, suspect, or contested';
  END IF;
  RETURN NEW;
END;
$function$;

-- Type de média des posts (image par défaut : tous les posts existants sont des photos
-- sauf les PR, qui sont des vidéos).
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

UPDATE public.posts SET media_type = 'video' WHERE type = 'pr' AND media_url IS NOT NULL;

-- Le post auto-créé pour un PR est désormais marqué comme vidéo et porte le nom réel de l'exercice.
CREATE OR REPLACE FUNCTION public.auto_post_pr()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.posts (user_id, type, media_url, media_type, caption, pr_id)
  VALUES (
    NEW.user_id,
    'pr',
    NEW.video_url,
    CASE WHEN NEW.video_url IS NULL THEN 'image' ELSE 'video' END,
    COALESCE(NEW.exercise_name, NEW.exercise) || ' — ' || NEW.weight_kg || ' kg × ' || NEW.reps,
    NEW.id
  );
  RETURN NEW;
END;
$function$;