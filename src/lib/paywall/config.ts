/**
 * Configuration de la couche paiement.
 *
 * Aucune clé n'est inventée ici : tout vient des variables d'environnement.
 * Tant que les clés RevenueCat et les identifiants produits App Store /
 * Google Play ne sont pas renseignés, l'app tourne en MODE DEV explicite
 * (non production, aucun paiement réel).
 */
import type { PlanId } from "./plans";

const env = import.meta.env as Record<string, string | undefined>;

export const REVENUECAT_IOS_KEY = env["VITE_REVENUECAT_IOS_KEY"] ?? "";
export const REVENUECAT_ANDROID_KEY = env["VITE_REVENUECAT_ANDROID_KEY"] ?? "";
export const REVENUECAT_ENTITLEMENT = env["VITE_REVENUECAT_ENTITLEMENT"] ?? "premium";

/** Identifiants produits store, à renseigner une fois créés côté App Store / Play. */
export const STORE_PRODUCT_IDS: Record<PlanId, string> = {
  centuria_standard: env["VITE_PRODUCT_ID_STANDARD"] ?? "",
  centuria_student: env["VITE_PRODUCT_ID_STUDENT"] ?? "",
};

export type PaywallMode = "revenuecat" | "dev";

export function isNativeRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function revenueCatConfigured(): boolean {
  return (
    (REVENUECAT_IOS_KEY.length > 0 || REVENUECAT_ANDROID_KEY.length > 0) &&
    Object.values(STORE_PRODUCT_IDS).some((id) => id.length > 0)
  );
}

/** Les achats in-app n'existent que dans l'app installée (App Store / Google Play). */
export function purchasesAvailable(): boolean {
  return isNativeRuntime() && revenueCatConfigured();
}

/** Mode effectif : RevenueCat seulement en natif ET avec clés + produits configurés. */
export function paywallMode(): PaywallMode {
  return isNativeRuntime() && revenueCatConfigured() ? "revenuecat" : "dev";
}

/** Ce qu'il reste à brancher — affiché dans le paywall en mode dev. */
export function missingSetup(): string[] {
  const missing: string[] = [];
  if (!REVENUECAT_IOS_KEY) missing.push("Clé publique RevenueCat iOS (VITE_REVENUECAT_IOS_KEY)");
  if (!REVENUECAT_ANDROID_KEY)
    missing.push("Clé publique RevenueCat Android (VITE_REVENUECAT_ANDROID_KEY)");
  if (!STORE_PRODUCT_IDS.centuria_standard)
    missing.push("Produit Standard App Store / Play (VITE_PRODUCT_ID_STANDARD)");
  if (!STORE_PRODUCT_IDS.centuria_student)
    missing.push("Produit Étudiant App Store / Play (VITE_PRODUCT_ID_STUDENT)");
  missing.push("Vérification du statut étudiant (VITE_STUDENT_VERIFICATION_PROVIDER)");
  missing.push("Webhook RevenueCat → /api/public/revenuecat-webhook (secret REVENUECAT_WEBHOOK_SECRET)");
  if (!isNativeRuntime())
    missing.push("Build natif iOS / Android (les achats in-app n'existent pas sur le web)");
  return missing;
}
