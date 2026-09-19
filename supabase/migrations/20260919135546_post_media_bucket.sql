-- CENTURIA: bucket "post-media" pour vidéos d'entraînement / photos (non-PR),
-- + ouverture de la lecture des vidéos de PR à tous les utilisateurs
-- connectés (nécessaire pour le vote communautaire et le feed).

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', false)
ON CONFLICT (id) DO NOTHING;

-- pr-videos : la lecture doit être ouverte à tout utilisateur connecté
-- (jusqu'ici restreinte au propriétaire, ce qui cassait l'affichage des PR
-- des autres athlètes dans le feed). Écriture toujours réservée au propriétaire.
DROP POLICY IF EXISTS "pr-videos owner select" ON storage.objects;
CREATE POLICY "pr-videos readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pr-videos');

-- post-media : lecture réservée aux utilisateurs connectés, écriture
-- réservée au propriétaire du dossier <user_id>/… — même modèle que avatars.
CREATE POLICY "post-media readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-media');

CREATE POLICY "post-media owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "post-media owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "post-media owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
