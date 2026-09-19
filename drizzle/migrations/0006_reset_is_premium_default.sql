-- Le premium ne doit jamais être accordé par défaut (reliquat du mode QA).
ALTER TABLE public.profiles ALTER COLUMN is_premium SET DEFAULT false;

-- Retire l'accès premium accordé uniquement par cet ancien défaut
-- (aucun achat, aucun octroi explicite enregistré).
UPDATE public.profiles
SET is_premium = false
WHERE is_premium = true
  AND premium_provider IS NULL
  AND premium_updated_at IS NULL;