export type PlanId = "centuria_standard" | "centuria_student";

export type Plan = {
  id: PlanId;
  label: string;
  period: "mois";
  priceLabel: string;
  badge?: string;
  note?: string;
};

export const PREMIUM_ENTITLEMENT = "premium";

export const PLANS: Plan[] = [
  {
    id: "centuria_standard",
    label: "Standard",
    period: "mois",
    priceLabel: "25 €",
  },
  {
    id: "centuria_student",
    label: "Étudiant",
    period: "mois",
    priceLabel: "13 €",
    badge: "-48%",
    note: "Justificatif requis",
  },
];

export const PREMIUM_FEATURES: { title: string; description: string }[] = [
  {
    title: "Coach IA complet",
    description: "Chat, séances perso, suivi de récupération musculaire.",
  },
  {
    title: "Scan photo nutrition",
    description: "Prends une assiette en photo, macros remplies en 3s.",
  },
  {
    title: "Recettes personnalisées",
    description: "Recettes générées pour tes objectifs et macros restantes.",
  },
  {
    title: "Feedback vidéo de forme",
    description: "Analyse IA de tes exécutions à partir d'une vidéo.",
  },
  {
    title: "Plateau & prédiction PR",
    description: "Détection de stagnation et projection de ton prochain PR.",
  },
  {
    title: "Rapport hebdomadaire",
    description: "Bilan complet volume, macros, PRs, chaque semaine.",
  },
];
