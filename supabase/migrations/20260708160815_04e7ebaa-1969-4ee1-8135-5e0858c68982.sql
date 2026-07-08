
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (COALESCE(qual,'') LIKE '%pr-videos%' OR COALESCE(with_check,'') LIKE '%pr-videos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "pr-videos owner select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pr-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "pr-videos owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pr-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "pr-videos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'pr-videos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'pr-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "pr-videos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'pr-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own PRs"
ON public.prs FOR DELETE TO authenticated
USING (auth.uid() = user_id);
