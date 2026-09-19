-- 1. Vue publique du profil : uniquement les colonnes sociales, jamais poids/âge/taille/premium.
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_barrier = true) AS
SELECT
  p.user_id,
  p.pseudo,
  p.bio,
  p.avatar_url,
  p.cover_url,
  p.current_grade,
  p.xp,
  p.posts_count,
  p.followers_count,
  p.following_count,
  p.created_at
FROM public.profiles p;

REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT ALL ON public.profiles_public TO service_role;

-- 2. profiles : lecture directe limitée au propriétaire (les données santé ne sortent plus).
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Avatars : plus d'accès anonyme au bucket.
DROP POLICY IF EXISTS "Avatars are readable by everyone" ON storage.objects;
CREATE POLICY "Avatars readable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');