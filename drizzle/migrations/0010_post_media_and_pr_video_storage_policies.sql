-- Les vidéos de PR doivent être lisibles par tout utilisateur connecté
-- (vote communautaire dans le feed). Écriture toujours owner-only.
DROP POLICY IF EXISTS "pr-videos owner select" ON storage.objects;
DROP POLICY IF EXISTS "pr-videos readable by authenticated" ON storage.objects;
CREATE POLICY "pr-videos readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pr-videos');

DROP POLICY IF EXISTS "post-media readable by authenticated" ON storage.objects;
CREATE POLICY "post-media readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "post-media owner insert" ON storage.objects;
CREATE POLICY "post-media owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "post-media owner delete" ON storage.objects;
CREATE POLICY "post-media owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);