
-- exercises catalog
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT,
  difficulty TEXT NOT NULL DEFAULT 'intermediaire',
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises readable by authenticated"
  ON public.exercises FOR SELECT TO authenticated USING (true);

-- workout_sessions
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_min INTEGER,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX workout_sessions_user_completed_idx ON public.workout_sessions(user_id, completed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_sessions owner select"
  ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "workout_sessions owner insert"
  ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workout_sessions owner update"
  ON public.workout_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workout_sessions owner delete"
  ON public.workout_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- coach_conversations (chat history)
CREATE TABLE public.coach_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX coach_conversations_user_created_idx ON public.coach_conversations(user_id, created_at ASC);
GRANT SELECT, INSERT, DELETE ON public.coach_conversations TO authenticated;
GRANT ALL ON public.coach_conversations TO service_role;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_conversations owner select"
  ON public.coach_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "coach_conversations owner insert"
  ON public.coach_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_conversations owner delete"
  ON public.coach_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Validation trigger for role
CREATE OR REPLACE FUNCTION public.validate_coach_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN ('user', 'assistant') THEN
    RAISE EXCEPTION 'role must be user or assistant';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER coach_conversations_validate
  BEFORE INSERT OR UPDATE ON public.coach_conversations
  FOR EACH ROW EXECUTE FUNCTION public.validate_coach_role();

-- Seed exercises catalog
INSERT INTO public.exercises (name, muscle_groups, equipment, difficulty, instructions) VALUES
('Squat', ARRAY['jambes','fessiers','abdos'], 'barre', 'intermediaire', 'Descends jusqu''à ce que les cuisses soient parallèles au sol, dos droit.'),
('Front Squat', ARRAY['jambes','fessiers','abdos'], 'barre', 'avance', 'Barre en rack avant, coudes hauts, torse vertical.'),
('Fentes bulgares', ARRAY['jambes','fessiers'], 'haltères', 'intermediaire', 'Pied arrière surélevé, descente contrôlée.'),
('Leg Press', ARRAY['jambes','fessiers'], 'machine', 'debutant', 'Amplitude complète, ne pas verrouiller les genoux.'),
('Soulevé de terre', ARRAY['dos','jambes','fessiers'], 'barre', 'avance', 'Dos neutre, barre proche des tibias, hanches et genoux ensemble.'),
('Rowing barre', ARRAY['dos','biceps'], 'barre', 'intermediaire', 'Torse penché à 45°, tire vers le nombril.'),
('Tractions', ARRAY['dos','biceps'], 'poids du corps', 'intermediaire', 'Menton au dessus de la barre, contrôle la descente.'),
('Tirage vertical', ARRAY['dos','biceps'], 'machine', 'debutant', 'Coudes vers le bas, poitrine ouverte.'),
('Développé couché', ARRAY['pectoraux','triceps','epaules'], 'barre', 'intermediaire', 'Omoplates serrées, barre à mi-pecs, pieds au sol.'),
('Développé incliné haltères', ARRAY['pectoraux','epaules','triceps'], 'haltères', 'intermediaire', 'Banc à 30°, coudes à 45° du buste.'),
('Dips', ARRAY['pectoraux','triceps'], 'poids du corps', 'intermediaire', 'Buste légèrement penché pour cibler pecs.'),
('Écarté couché', ARRAY['pectoraux'], 'haltères', 'debutant', 'Bras légèrement fléchis, amplitude large.'),
('Développé militaire', ARRAY['epaules','triceps'], 'barre', 'intermediaire', 'Barre au niveau des clavicules, poussée verticale.'),
('Élévations latérales', ARRAY['epaules'], 'haltères', 'debutant', 'Léger bend au coude, jusqu''à hauteur d''épaules.'),
('Oiseau', ARRAY['epaules','dos'], 'haltères', 'debutant', 'Torse penché, tire les coudes vers le plafond.'),
('Curl haltères', ARRAY['biceps','avant_bras'], 'haltères', 'debutant', 'Coudes fixes le long du corps.'),
('Curl marteau', ARRAY['biceps','avant_bras'], 'haltères', 'debutant', 'Prise neutre, cible le brachial.'),
('Extension triceps poulie', ARRAY['triceps'], 'poulie', 'debutant', 'Coudes fixes, extension complète.'),
('Crunch', ARRAY['abdos'], 'poids du corps', 'debutant', 'Décolle les omoplates, expire en montant.'),
('Planche', ARRAY['abdos','epaules'], 'poids du corps', 'debutant', 'Corps aligné, gainage 30-60s.');
