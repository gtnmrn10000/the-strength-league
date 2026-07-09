// Mifflin-St Jeor TDEE calculation

export type Sexe = "homme" | "femme";
export type ActivityLevel = "sedentaire" | "leger" | "modere" | "intense" | "tres_intense";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  intense: 1.725,
  tres_intense: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentaire: "Sédentaire",
  leger: "Léger",
  modere: "Modéré",
  intense: "Intense",
  tres_intense: "Très intense",
};

export function bmr({
  sexe,
  poids_kg,
  taille_cm,
  age,
}: {
  sexe: Sexe;
  poids_kg: number;
  taille_cm: number;
  age: number;
}) {
  const base = 10 * poids_kg + 6.25 * taille_cm - 5 * age;
  return sexe === "homme" ? base + 5 : base - 161;
}

export function tdee(input: {
  sexe: Sexe;
  poids_kg: number;
  taille_cm: number;
  age: number;
  activite: ActivityLevel;
}) {
  return Math.round(bmr(input) * ACTIVITY_FACTOR[input.activite]);
}

export type MacroGoals = { kcal: number; prot: number; carbs: number; fat: number };

// Standard split : 30% prot, 40% gluc, 30% lip
export function macroGoalsFromTdee(kcal: number): MacroGoals {
  return {
    kcal,
    prot: Math.round((kcal * 0.3) / 4),
    carbs: Math.round((kcal * 0.4) / 4),
    fat: Math.round((kcal * 0.3) / 9),
  };
}

// Fallback goals when profile data is incomplete
export const DEFAULT_GOALS: MacroGoals = { kcal: 2200, prot: 165, carbs: 220, fat: 73 };
