-- Colonnes d'entitlement (additives, nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_provider text,
  ADD COLUMN IF NOT EXISTS premium_product_id text,
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS premium_will_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_store_user_id text,
  ADD COLUMN IF NOT EXISTS premium_updated_at timestamptz;

-- Un client (anon/authenticated) ne peut plus s'auto-attribuer le premium.
CREATE OR REPLACE FUNCTION public.guard_premium_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  jwt_role text := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
BEGIN
  IF jwt_role IN ('anon', 'authenticated') THEN
    NEW.is_premium          := OLD.is_premium;
    NEW.premium_provider    := OLD.premium_provider;
    NEW.premium_product_id  := OLD.premium_product_id;
    NEW.premium_expires_at  := OLD.premium_expires_at;
    NEW.premium_will_renew  := OLD.premium_will_renew;
    NEW.premium_store_user_id := OLD.premium_store_user_id;
    NEW.premium_updated_at  := OLD.premium_updated_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_premium_columns_trg ON public.profiles;
CREATE TRIGGER guard_premium_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_premium_columns();

-- Entitlement réel : flag premium valide et non expiré.
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT p.is_premium
       AND (p.premium_expires_at IS NULL OR p.premium_expires_at > now())
     FROM public.profiles p
     WHERE p.user_id = auth.uid()),
    false);
$$;

-- Détail d'abonnement, lisible uniquement pour soi-même.
CREATE OR REPLACE FUNCTION public.get_my_entitlement()
RETURNS TABLE(
  is_premium boolean,
  provider text,
  product_id text,
  expires_at timestamptz,
  will_renew boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (p.is_premium AND (p.premium_expires_at IS NULL OR p.premium_expires_at > now())),
    p.premium_provider,
    p.premium_product_id,
    p.premium_expires_at,
    p.premium_will_renew,
    p.premium_updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.guard_premium_columns() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_premium() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_entitlement() TO authenticated;