
-- 1) exercises: recovery_hours + reseed
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS recovery_hours INTEGER NOT NULL DEFAULT 48;

DELETE FROM public.exercises;
INSERT INTO public.exercises (name, muscle_groups, recovery_hours, equipment, difficulty, instructions) VALUES
('Squat',                   ARRAY['quadriceps','fessiers','ischios'], 72, 'barre',          'intermediaire', 'Descends jusqu''à ce que les cuisses soient parallèles au sol, dos droit.'),
('Front Squat',             ARRAY['quadriceps','fessiers'],           72, 'barre',          'avance',        'Barre en rack avant, coudes hauts, torse vertical.'),
('Fentes bulgares',         ARRAY['quadriceps','fessiers'],           72, 'haltères',       'intermediaire', 'Pied arrière surélevé, descente contrôlée.'),
('Leg Press',               ARRAY['quadriceps','fessiers'],           72, 'machine',        'debutant',      'Amplitude complète, ne pas verrouiller les genoux.'),
('Leg curl',                ARRAY['ischios'],                          72, 'machine',        'debutant',      'Isole les ischios.'),
('Soulevé de terre',        ARRAY['dos','ischios','fessiers'],         72, 'barre',          'avance',        'Dos neutre, barre proche des tibias, hanches et genoux ensemble.'),
('Hip thrust',              ARRAY['fessiers','ischios'],               72, 'barre',          'intermediaire', 'Contraction fessiers en haut, dos neutre.'),
('Rowing barre',            ARRAY['dos','biceps'],                     48, 'barre',          'intermediaire', 'Torse penché à 45°, tire vers le nombril.'),
('Tractions',               ARRAY['dos','biceps'],                     48, 'poids du corps', 'intermediaire', 'Menton au dessus de la barre, contrôle la descente.'),
('Tirage vertical',         ARRAY['dos','biceps'],                     48, 'machine',        'debutant',      'Coudes vers le bas, poitrine ouverte.'),
('Développé couché',        ARRAY['pectoraux','triceps','epaules'],   48, 'barre',          'intermediaire', 'Omoplates serrées, barre à mi-pecs, pieds au sol.'),
('Développé incliné',       ARRAY['pectoraux','epaules','triceps'],   48, 'haltères',       'intermediaire', 'Banc à 30°, coudes à 45° du buste.'),
('Dips',                    ARRAY['pectoraux','triceps'],             48, 'poids du corps', 'intermediaire', 'Buste légèrement penché pour cibler pecs.'),
('Écarté couché',           ARRAY['pectoraux'],                        48, 'haltères',       'debutant',      'Bras légèrement fléchis, amplitude large.'),
('Développé militaire',     ARRAY['epaules','triceps'],               48, 'barre',          'intermediaire', 'Barre au niveau des clavicules, poussée verticale.'),
('Élévations latérales',    ARRAY['epaules'],                          48, 'haltères',       'debutant',      'Léger bend au coude, jusqu''à hauteur d''épaules.'),
('Oiseau',                  ARRAY['epaules','dos'],                    48, 'haltères',       'debutant',      'Torse penché, tire les coudes vers le plafond.'),
('Curl haltères',           ARRAY['biceps','avant_bras'],             30, 'haltères',       'debutant',      'Coudes fixes le long du corps.'),
('Curl marteau',            ARRAY['biceps','avant_bras'],             30, 'haltères',       'debutant',      'Prise neutre, cible le brachial.'),
('Extension triceps poulie',ARRAY['triceps'],                          30, 'poulie',         'debutant',      'Coudes fixes, extension complète.'),
('Crunch',                  ARRAY['abdos'],                            24, 'poids du corps', 'debutant',      'Décolle les omoplates, expire en montant.'),
('Planche',                 ARRAY['abdos','epaules'],                  24, 'poids du corps', 'debutant',      'Corps aligné, gainage 30-60s.'),
('Mollets debout',          ARRAY['mollets'],                          24, 'machine',        'debutant',      'Amplitude complète, contraction en haut.');

-- 2) coach_conversations: 1 ligne/user, messages jsonb, updated_at
DROP TABLE IF EXISTS public.coach_conversations CASCADE;
CREATE TABLE public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_conversations TO authenticated;
GRANT ALL ON public.coach_conversations TO service_role;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_conv owner select"
  ON public.coach_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "coach_conv owner insert"
  ON public.coach_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_conv owner update"
  ON public.coach_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_conv owner delete"
  ON public.coach_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
