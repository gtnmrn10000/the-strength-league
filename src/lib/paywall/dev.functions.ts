/**
 * MODE DEV — non production.
 *
 * Permet d'activer/désactiver l'entitlement premium pour SON PROPRE compte,
 * uniquement si la variable serveur `PAYWALL_DEV_MODE` vaut "true".
 * En production (variable absente ou "false"), ces fonctions refusent tout.
 * Aucun paiement n'est déclenché.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const isDevPaywallEnabled = createServerFn({ method: "GET" }).handler(async () => ({
  enabled: process.env["PAYWALL_DEV_MODE"] === "true",
}));

export const setDevPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { active: boolean; productId?: string }) => ({
    active: !!input?.active,
    productId: input?.productId ?? "dev_centuria_standard",
  }))
  .handler(async ({ data, context }) => {
    if (process.env["PAYWALL_DEV_MODE"] !== "true") {
      throw new Error("Mode dev désactivé : aucun entitlement ne peut être attribué ici.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: data.active,
        premium_provider: data.active ? "dev" : null,
        premium_product_id: data.active ? data.productId : null,
        premium_expires_at: null,
        premium_will_renew: false,
        premium_updated_at: new Date().toISOString(),
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, active: data.active };
  });
