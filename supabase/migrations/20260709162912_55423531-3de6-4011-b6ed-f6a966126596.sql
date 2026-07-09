
DO $$ BEGIN
  CREATE TYPE public.sexe_type AS ENUM ('homme', 'femme');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_level AS ENUM ('sedentaire', 'leger', 'modere', 'intense', 'tres_intense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.food_source AS ENUM ('barcode', 'photo', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sexe public.sexe_type,
  ADD COLUMN IF NOT EXISTS niveau_activite public.activity_level DEFAULT 'modere';

CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source public.food_source NOT NULL DEFAULT 'manual',
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity_g NUMERIC NOT NULL CHECK (quantity_g > 0),
  calories NUMERIC NOT NULL DEFAULT 0,
  proteins_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fats_g NUMERIC NOT NULL DEFAULT 0,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own food_logs" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own food_logs" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own food_logs" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own food_logs" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS food_logs_user_logged_idx ON public.food_logs (user_id, logged_at DESC);
