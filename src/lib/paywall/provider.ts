/**
 * Abstraction paiement / entitlements.
 *
 * L'application dépend UNIQUEMENT de cette interface — jamais d'une
 * implémentation concrète :
 *  - `RevenueCatPaywallProvider` : achats in-app natifs (iOS/Android) via
 *    RevenueCat, actif dès que les clés + produits sont configurés.
 *  - `DevPaywallProvider` : fallback web / non configuré. Aucun paiement.
 *
 * Dans tous les cas, `getStatus()` relit l'entitlement depuis la base
 * (source de vérité serveur), jamais depuis un état local.
 */
import type { PlanId } from "./plans";
import {
  fetchEntitlement,
  NO_ENTITLEMENT,
  type EntitlementStatus,
} from "./entitlement";
import { checkStudentEligibility, studentVerificationConfigured } from "./eligibility";
import { planById } from "./plans";
import {
  paywallMode,
  REVENUECAT_ANDROID_KEY,
  REVENUECAT_IOS_KEY,
  REVENUECAT_ENTITLEMENT,
  STORE_PRODUCT_IDS,
} from "./config";
import { setDevPremium } from "./dev.functions";

export type { EntitlementStatus };

export type StorePrices = Partial<Record<PlanId, string>>;

export interface PaywallProvider {
  readonly mode: "revenuecat" | "dev";
  getStatus(): Promise<EntitlementStatus>;
  /** Prix localisés renvoyés par le store (vide si indisponible). */
  getPrices(): Promise<StorePrices>;
  purchase(planId: PlanId): Promise<EntitlementStatus>;
  restore(): Promise<EntitlementStatus>;
}

/**
 * MODE DEV (non production) — n'appelle aucun store.
 * L'activation passe par une server function protégée par la variable
 * serveur `PAYWALL_DEV_MODE`; si elle est désactivée, l'achat échoue proprement.
 */
export class DevPaywallProvider implements PaywallProvider {
  readonly mode = "dev" as const;

  async getStatus(): Promise<EntitlementStatus> {
    try {
      return await fetchEntitlement();
    } catch {
      return NO_ENTITLEMENT;
    }
  }

  async getPrices(): Promise<StorePrices> {
    return {};
  }

  async purchase(planId: PlanId): Promise<EntitlementStatus> {
    await setDevPremium({
      data: { active: true, productId: STORE_PRODUCT_IDS[planId] || `dev_${planId}` },
    });
    return this.getStatus();
  }

  async restore(): Promise<EntitlementStatus> {
    return this.getStatus();
  }
}

type RCPurchases = {
  configure: (opts: { apiKey: string; appUserID?: string | null }) => Promise<void>;
  getOfferings: () => Promise<{ current?: { availablePackages: RCPackage[] } | null }>;
  purchasePackage: (opts: { aPackage: RCPackage }) => Promise<unknown>;
  restorePurchases: () => Promise<unknown>;
  logIn: (opts: { appUserID: string }) => Promise<unknown>;
};
type RCPackage = {
  identifier: string;
  product: { identifier: string; priceString?: string };
};

/**
 * Achats in-app natifs via RevenueCat (StoreKit / Google Play Billing).
 * Le plugin `@revenuecat/purchases-capacitor` est importé dynamiquement :
 * il n'est requis que dans un build natif configuré.
 * La vérification d'achat côté serveur se fait par le webhook RevenueCat
 * (`/api/public/revenuecat-webhook`), qui écrit l'entitlement en base.
 */
export class RevenueCatPaywallProvider implements PaywallProvider {
  readonly mode = "revenuecat" as const;
  private sdk: RCPurchases | null = null;

  private async load(): Promise<RCPurchases> {
    if (this.sdk) return this.sdk;
    const spec = "@revenuecat/purchases-capacitor";
    const mod = (await import(/* @vite-ignore */ spec)) as { Purchases: RCPurchases };
    const apiKey =
      /android/i.test(navigator.userAgent) && REVENUECAT_ANDROID_KEY
        ? REVENUECAT_ANDROID_KEY
        : REVENUECAT_IOS_KEY;
    await mod.Purchases.configure({ apiKey });
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) await mod.Purchases.logIn({ appUserID: data.user.id });
    this.sdk = mod.Purchases;
    return mod.Purchases;
  }

  async getStatus(): Promise<EntitlementStatus> {
    // L'entitlement fait foi côté serveur (mis à jour par le webhook RevenueCat).
    try {
      return await fetchEntitlement();
    } catch {
      return NO_ENTITLEMENT;
    }
  }

  async getPrices(): Promise<StorePrices> {
    try {
      const sdk = await this.load();
      const offerings = await sdk.getOfferings();
      const prices: StorePrices = {};
      for (const pkg of offerings.current?.availablePackages ?? []) {
        const price = pkg.product.priceString;
        if (!price) continue;
        for (const [planId, productId] of Object.entries(STORE_PRODUCT_IDS)) {
          if (productId && productId === pkg.product.identifier) {
            prices[planId as PlanId] = price;
          }
        }
      }
      return prices;
    } catch {
      return {};
    }
  }

  async purchase(planId: PlanId): Promise<EntitlementStatus> {
    const plan = planById(planId);
    if (plan.requiresEligibility === "student") {
      if (!studentVerificationConfigured()) {
        throw new Error(
          "La formule Étudiant n'est pas encore ouverte : la vérification du statut étudiant n'est pas branchée."
        );
      }
      const state = await checkStudentEligibility();
      if (state !== "eligible") {
        throw new Error("Ton statut étudiant doit être vérifié avant de souscrire cette formule.");
      }
    }
    const productId = STORE_PRODUCT_IDS[planId];
    if (!productId) throw new Error("Produit store non configuré pour cette formule.");
    const sdk = await this.load();
    const offerings = await sdk.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.product.identifier === productId
    );
    if (!pkg) throw new Error("Formule indisponible sur le store.");
    await sdk.purchasePackage({ aPackage: pkg });
    return this.getStatus();
  }

  async restore(): Promise<EntitlementStatus> {
    const sdk = await this.load();
    await sdk.restorePurchases();
    return this.getStatus();
  }
}

let instance: PaywallProvider | null = null;

/** Provider actif, résolu à la volée (le runtime natif n'est connu qu'au client). */
export function getPaywallProvider(): PaywallProvider {
  const mode = paywallMode();
  if (!instance || instance.mode !== mode) {
    instance = mode === "revenuecat" ? new RevenueCatPaywallProvider() : new DevPaywallProvider();
  }
  return instance;
}

export const ENTITLEMENT_ID = REVENUECAT_ENTITLEMENT;
