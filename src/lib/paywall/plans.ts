/**
 * Catalogue des plans premium Centuria.
 *
 * Les `id` correspondront aux identifiants produit RevenueCat
 * (App Store / Play Store) une fois l'intégration branchée.
 * Les prix affichés ici sont indicatifs ; RevenueCat renverra
 * les prix localisés à la place au runtime.
 */
export type PlanId = "centuria_monthly" | "centuria_yearly";

export type Plan = {
  id: PlanId;
  label: string;
  period: "mois" | "an";
  priceLabel: string;
  pricePerMonthLabel?: string;
  badge?: string;
  savings?: string;
};

export const PREMIUM_ENTITLEMENT = "premium";

export const PLANS: Plan[] = [
  {
    id: "centuria_monthly",
    label: "Mensuel",
    period: "mois",
    priceLabel: "9,99 €",
  },
  {
    id: "centuria_yearly",
    label: "Annuel",
    period: "an",
    priceLabel: "59,99 €",
    pricePerMonthLabel: "≈ 5,00 €/mois",
    badge: "MEILLEURE OFFRE",
    savings: "-50%",
  },
];

export const PREMIUM_FEATURES: { title: string; description: string }[] = [
  {
    title: "Coach IA illimité",
    description: "Chat, séances personnalisées, analyse hebdo, suivi de récupération musculaire.",
  },
  {
    title: "Photo IA nutrition",
    description: "Scanne une assiette et récupère macros + calories en 3 secondes.",
  },
  {
    title: "Analyse avancée",
    description: "Détection de plateau, prédiction de PR et rapports hebdomadaires.",
  },
  {
    title: "Support prioritaire",
    description: "Accès direct à l'équipe Centuria pour tes questions.",
  },
];
