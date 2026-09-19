DROP POLICY IF EXISTS "xp_events_insert_own" ON public.xp_events;

DROP POLICY IF EXISTS "Users select own food_logs" ON public.food_logs;
CREATE POLICY "Users select own food_logs" ON public.food_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own food_logs" ON public.food_logs;
CREATE POLICY "Users insert own food_logs" ON public.food_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own food_logs" ON public.food_logs;
CREATE POLICY "Users update own food_logs" ON public.food_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own food_logs" ON public.food_logs;
CREATE POLICY "Users delete own food_logs" ON public.food_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);