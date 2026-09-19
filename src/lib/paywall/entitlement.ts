/**
 * Source de vérité des entitlements : la base, jamais un booléen local.
 * Le flag premium n'est modifiable que par le serveur (trigger
 * `guard_premium_columns` : un client authentifié ne peut pas se l'attribuer).
 */
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "./plans";

export type EntitlementStatus = {
  isPremium: boolean;
  activePlan: PlanId | null;
  productId: string | null;
  expiresAt: string | null;
  willRenew: boolean;
  provider: string | null;
};

export const NO_ENTITLEMENT: EntitlementStatus = {
  isPremium: false,
  activePlan: null,
  productId: null,
  expiresAt: null,
  willRenew: false,
  provider: null,
};

function planFromProduct(productId: string | null): PlanId | null {
  if (!productId) return null;
  if (productId.includes("student") || productId.includes("etudiant")) return "centuria_student";
  return "centuria_standard";
}

/** Lit l'entitlement réel de l'utilisateur connecté (RPC owner-only). */
export async function fetchEntitlement(): Promise<EntitlementStatus> {
  const { data, error } = await supabase.rpc("get_my_entitlement");
  if (error || !data || (Array.isArray(data) && data.length === 0)) return NO_ENTITLEMENT;
  const row = (Array.isArray(data) ? data[0] : data) as {
    is_premium: boolean | null;
    provider: string | null;
    product_id: string | null;
    expires_at: string | null;
    will_renew: boolean | null;
  };
  return {
    isPremium: !!row.is_premium,
    activePlan: planFromProduct(row.product_id),
    productId: row.product_id,
    expiresAt: row.expires_at,
    willRenew: !!row.will_renew,
    provider: row.provider,
  };
}
