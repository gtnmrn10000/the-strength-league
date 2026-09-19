CREATE TABLE public.exercise_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

GRANT SELECT, INSERT, DELETE ON public.exercise_favorites TO authenticated;
GRANT ALL ON public.exercise_favorites TO service_role;

ALTER TABLE public.exercise_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites select own" ON public.exercise_favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorites insert own" ON public.exercise_favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites delete own" ON public.exercise_favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.custom_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  primary_muscle text NOT NULL,
  equipment text NOT NULL DEFAULT 'halteres',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX custom_exercises_user_idx ON public.custom_exercises (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_exercises TO authenticated;
GRANT ALL ON public.custom_exercises TO service_role;

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom exercises select own" ON public.custom_exercises
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "custom exercises insert own" ON public.custom_exercises
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom exercises update own" ON public.custom_exercises
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom exercises delete own" ON public.custom_exercises
  FOR DELETE TO authenticated USING (auth.uid() = user_id);