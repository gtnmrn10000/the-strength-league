import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie le statut d'abonnement d'un utilisateur.
 * Aujourd'hui : lit le flag `is_premium` sur `profiles` (mock).
 * Demain : brancher RevenueCat ici sans changer les call-sites.
 */
export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return !!data?.is_premium;
}

/** Version pratique pour le user courant côté client. */
export async function isCurrentUserPremium(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  return checkSubscriptionStatus(auth.user.id);
}
