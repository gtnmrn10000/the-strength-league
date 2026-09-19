export type PlanId = "centuria_standard" | "centuria_student";

export type Plan = {
  id: PlanId;
  /** Nom commercial affiché (identique App Store / Google Play). */
  label: string;
  period: "mois";
  /** Prix de référence, affiché tant que le store n'a pas renvoyé son prix localisé. */
  referencePrice: string;
  badge?: string;
  note?: string;
  /** Formule soumise à une éligibilité (ex. statut étudiant). */
  requiresEligibility?: "student";
};

export const PREMIUM_ENTITLEMENT = "premium";

export const PLANS: Plan[] = [
  {
    id: "centuria_standard",
    label: "CENTURIA STANDARD",
    period: "mois",
    referencePrice: "26,99 €",
  },
  {
    id: "centuria_student",
    label: "CENTURIA ÉTUDIANT",
    period: "mois",
    referencePrice: "12,99 €",
    badge: "-52%",
    note: "Réservé aux étudiants — vérification requise",
    requiresEligibility: "student",
  },
];

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export const PREMIUM_FEATURES: { title: string; description: string }[] = [
  {
    title: "Coach complet",
    description: "Chat, séances perso, suivi de récupération musculaire.",
  },
  {
    title: "Scan photo nutrition",
    description: "Prends ton assiette en photo, les macros se remplissent.",
  },
  {
    title: "Recettes personnalisées",
    description: "Recettes calées sur tes objectifs et tes macros restantes.",
  },
  {
    title: "Plateau & projection",
    description: "Détection de stagnation et projection de ton prochain record.",
  },
  {
    title: "Rapport hebdomadaire",
    description: "Bilan volume, macros et records, chaque semaine.",
  },
];
