ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS scheduled_for date;

ALTER TABLE public.workout_sessions
  ALTER COLUMN completed_at DROP NOT NULL,
  ALTER COLUMN completed_at DROP DEFAULT;

CREATE INDEX IF NOT EXISTS workout_sessions_planned_idx
  ON public.workout_sessions (user_id, scheduled_for)
  WHERE completed_at IS NULL AND scheduled_for IS NOT NULL;
