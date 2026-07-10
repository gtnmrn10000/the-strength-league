/**
 * Interface d'abstraction pour la couche paiement / entitlements.
 *
 * L'application dépend UNIQUEMENT de cette interface — jamais d'une
 * implémentation concrète. Aujourd'hui : `MockPaywallProvider` qui
 * flip le flag `is_premium` sur `public.profiles`. Demain : swap pour
 * un `RevenueCatPaywallProvider` sans toucher les call-sites.
 *
 * Contrat :
 *   - `getStatus()` renvoie le statut d'entitlement courant.
 *   - `purchase(planId)` initie l'achat pour un plan donné.
 *   - `restore()` restaure les achats antérieurs (App Store / Play).
 */
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "./plans";

export type EntitlementStatus = {
  isPremium: boolean;
  activePlan: PlanId | null;
  expiresAt: string | null;
  willRenew: boolean;
  provider: "mock" | "revenuecat";
};

export interface PaywallProvider {
  getStatus(): Promise<EntitlementStatus>;
  purchase(planId: PlanId): Promise<EntitlementStatus>;
  restore(): Promise<EntitlementStatus>;
}

/**
 * Implémentation MOCK — utilisée en attendant RevenueCat.
 * Lit / écrit uniquement le flag `is_premium` sur le profil du user courant.
 *
 * ⚠️ NE PAS utiliser en production réelle : aucun paiement n'est traité,
 * l'utilisateur pourrait activer premium gratuitement côté client.
 * L'écriture est autorisée par la policy RLS "Users can update own profile"
 * (auth.uid() = user_id).
 */
export class MockPaywallProvider implements PaywallProvider {
  async getStatus(): Promise<EntitlementStatus> {
    const { data, error } = await supabase.rpc("is_current_user_premium");
    if (error) {
      return { isPremium: false, activePlan: null, expiresAt: null, willRenew: false, provider: "mock" };
    }
    return {
      isPremium: !!data,
      activePlan: data ? "centuria_standard" : null,
      expiresAt: null,
      willRenew: !!data,
      provider: "mock",
    };
  }

  // Mock uniquement : ne débloque PAS le premium. L'UI affiche un toast
  // "Bientôt disponible" et attend l'intégration RevenueCat.
  async purchase(_planId: PlanId): Promise<EntitlementStatus> {
    return this.getStatus();
  }

  async restore(): Promise<EntitlementStatus> {
    return this.getStatus();
  }
}

/** Instance active dans l'app. Sera remplacée par RevenueCat plus tard. */
export const paywallProvider: PaywallProvider = new MockPaywallProvider();
