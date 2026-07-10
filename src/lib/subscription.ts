import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie le statut premium de l'utilisateur connecté via la RPC sécurisée
 * `is_current_user_premium` (SECURITY DEFINER filtrée par auth.uid()).
 * Le champ `is_premium` n'est plus lisible via le Data API public.
 */
export async function isCurrentUserPremium(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_current_user_premium");
  if (error) return false;
  return !!data;
}

/**
 * Compat : on ne peut lire que son propre statut premium.
 * `userId` est ignoré ; renvoie le statut de l'utilisateur connecté.
 */
export async function checkSubscriptionStatus(_userId: string): Promise<boolean> {
  return isCurrentUserPremium();
}
