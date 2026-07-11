
-- 1. community_foods
CREATE TABLE public.community_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  kcal_100g NUMERIC NOT NULL CHECK (kcal_100g >= 0 AND kcal_100g <= 2000),
  protein_100g NUMERIC NOT NULL DEFAULT 0 CHECK (protein_100g >= 0 AND protein_100g <= 200),
  carbs_100g NUMERIC NOT NULL DEFAULT 0 CHECK (carbs_100g >= 0 AND carbs_100g <= 200),
  fat_100g NUMERIC NOT NULL DEFAULT 0 CHECK (fat_100g >= 0 AND fat_100g <= 200),
  serving_size TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.community_foods TO authenticated;
GRANT ALL ON public.community_foods TO service_role;
ALTER TABLE public.community_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_foods readable to signed in"
  ON public.community_foods FOR SELECT TO authenticated
  USING (verified = true);
CREATE POLICY "community_foods insert by signed in"
  ON public.community_foods FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "community_foods update own"
  ON public.community_foods FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE INDEX idx_community_foods_barcode ON public.community_foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_community_foods_name ON public.community_foods USING gin (to_tsvector('simple', name));

-- 2. weigh_ins
CREATE TABLE public.weigh_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 20 AND weight_kg < 400),
  bodyfat_pct NUMERIC CHECK (bodyfat_pct IS NULL OR (bodyfat_pct >= 3 AND bodyfat_pct <= 70)),
  waist_cm NUMERIC CHECK (waist_cm IS NULL OR (waist_cm >= 40 AND waist_cm <= 200)),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weigh_ins TO authenticated;
GRANT ALL ON public.weigh_ins TO service_role;
ALTER TABLE public.weigh_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weigh_ins select own" ON public.weigh_ins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "weigh_ins insert own" ON public.weigh_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weigh_ins update own" ON public.weigh_ins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weigh_ins delete own" ON public.weigh_ins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_weigh_ins_user_measured ON public.weigh_ins(user_id, measured_at DESC);

-- 3. Dev mode : is_premium=true par défaut + backfill
ALTER TABLE public.profiles ALTER COLUMN is_premium SET DEFAULT true;
UPDATE public.profiles SET is_premium = true WHERE is_premium IS DISTINCT FROM true;
