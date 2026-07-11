// Bibliothèque d'exercices — catégorisés par grand groupe musculaire visible.
// Chaque exercice cible un ou plusieurs muscles fins (clés recovery.ts).
import type { LucideIcon } from "lucide-react";
import {
  Dumbbell,
  Grip,
  Anchor,
  Footprints,
  MountainSnow,
  Zap,
  LayoutGrid,
} from "lucide-react";

export type LibraryExercise = {
  id: string;
  name: string;
  primary: string; // muscle principal (clé normalisée)
  muscles: string[]; // muscles secondaires inclus
  category: MuscleCategory;
};

export type MuscleCategory =
  | "pectoraux"
  | "dos"
  | "jambes"
  | "epaules"
  | "bras"
  | "abdos";

export const CATEGORY_LABEL: Record<MuscleCategory, string> = {
  pectoraux: "Pecs",
  dos: "Dos",
  jambes: "Jambes",
  epaules: "Épaules",
  bras: "Bras",
  abdos: "Abdos",
};

export const CATEGORY_ICON: Record<MuscleCategory, LucideIcon> = {
  pectoraux: Grip,
  dos: Anchor,
  jambes: Footprints,
  epaules: MountainSnow,
  bras: Zap,
  abdos: LayoutGrid,
};

export const CATEGORY_ACCENT: Record<MuscleCategory, string> = {
  pectoraux: "#ef4444",
  dos: "#3b82f6",
  jambes: "#22c55e",
  epaules: "#f59e0b",
  bras: "#a855f7",
  abdos: "#eab308",
};

/** Icône par défaut pour un exercice — dérivée de sa catégorie. */
export function exerciseIcon(ex: LibraryExercise): LucideIcon {
  return CATEGORY_ICON[ex.category] ?? Dumbbell;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Pectoraux (8)
  { id: "bench", name: "Bench Press", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },
  { id: "incline-bench", name: "Développé incliné barre", primary: "pectoraux", muscles: ["pectoraux", "epaules"], category: "pectoraux" },
  { id: "incline-db", name: "Développé incliné haltères", primary: "pectoraux", muscles: ["pectoraux", "epaules"], category: "pectoraux" },
  { id: "decline-bench", name: "Développé décliné", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },
  { id: "dumbbell-fly", name: "Écarté haltères", primary: "pectoraux", muscles: ["pectoraux"], category: "pectoraux" },
  { id: "cable-crossover", name: "Cable crossover", primary: "pectoraux", muscles: ["pectoraux"], category: "pectoraux" },
  { id: "dips", name: "Dips", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },
  { id: "push-up", name: "Pompes", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },

  // Dos (9)
  { id: "deadlift", name: "Deadlift", primary: "dos", muscles: ["dos", "ischios", "fessiers"], category: "dos" },
  { id: "pull-up", name: "Tractions pronation", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "chin-up", name: "Tractions supination", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "row-barbell", name: "Rowing barre", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "row-dumbbell", name: "Rowing haltère 1 bras", primary: "dos", muscles: ["dos"], category: "dos" },
  { id: "t-bar-row", name: "T-bar row", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "lat-pulldown", name: "Tirage vertical", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "seated-row", name: "Tirage horizontal", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "shrugs", name: "Shrugs", primary: "dos", muscles: ["dos"], category: "dos" },

  // Jambes (10)
  { id: "squat", name: "Back squat", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "front-squat", name: "Front squat", primary: "quadriceps", muscles: ["quadriceps", "abdos"], category: "jambes" },
  { id: "bulgarian", name: "Fentes bulgares", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "walking-lunge", name: "Fentes marchées", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "leg-press", name: "Presse à cuisses", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "leg-extension", name: "Leg extension", primary: "quadriceps", muscles: ["quadriceps"], category: "jambes" },
  { id: "hip-thrust", name: "Hip thrust", primary: "fessiers", muscles: ["fessiers", "ischios"], category: "jambes" },
  { id: "leg-curl", name: "Leg curl", primary: "ischios", muscles: ["ischios"], category: "jambes" },
  { id: "rdl", name: "Soulevé de terre roumain", primary: "ischios", muscles: ["ischios", "fessiers"], category: "jambes" },
  { id: "calf-raise", name: "Mollets debout", primary: "mollets", muscles: ["mollets"], category: "jambes" },

  // Épaules (8)
  { id: "ohp", name: "Développé militaire", primary: "epaules", muscles: ["epaules", "triceps"], category: "epaules" },
  { id: "db-press", name: "Développé haltères", primary: "epaules", muscles: ["epaules", "triceps"], category: "epaules" },
  { id: "arnold", name: "Arnold press", primary: "epaules", muscles: ["epaules"], category: "epaules" },
  { id: "lateral-raise", name: "Élévations latérales", primary: "epaules", muscles: ["epaules"], category: "epaules" },
  { id: "front-raise", name: "Élévations frontales", primary: "epaules", muscles: ["epaules"], category: "epaules" },
  { id: "rear-delt-fly", name: "Oiseau (rear delts)", primary: "epaules", muscles: ["epaules"], category: "epaules" },
  { id: "face-pull", name: "Face pull", primary: "epaules", muscles: ["epaules", "dos"], category: "epaules" },
  { id: "upright-row", name: "Rowing menton", primary: "epaules", muscles: ["epaules", "dos"], category: "epaules" },

  // Bras (9)
  { id: "curl-barbell", name: "Curl barre", primary: "biceps", muscles: ["biceps"], category: "bras" },
  { id: "curl-dumbbell", name: "Curl haltères", primary: "biceps", muscles: ["biceps"], category: "bras" },
  { id: "hammer-curl", name: "Curl marteau", primary: "biceps", muscles: ["biceps", "avant_bras"], category: "bras" },
  { id: "preacher-curl", name: "Curl pupitre", primary: "biceps", muscles: ["biceps"], category: "bras" },
  { id: "tricep-pushdown", name: "Extension poulie", primary: "triceps", muscles: ["triceps"], category: "bras" },
  { id: "tricep-extension", name: "Extension nuque", primary: "triceps", muscles: ["triceps"], category: "bras" },
  { id: "skullcrusher", name: "Skullcrusher", primary: "triceps", muscles: ["triceps"], category: "bras" },
  { id: "close-grip-bench", name: "Bench prise serrée", primary: "triceps", muscles: ["triceps", "pectoraux"], category: "bras" },
  { id: "forearm-curl", name: "Curl avant-bras", primary: "avant_bras", muscles: ["avant_bras"], category: "bras" },

  // Abdos (8)
  { id: "plank", name: "Gainage", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "side-plank", name: "Gainage latéral", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "hanging-leg-raise", name: "Relevé de jambes suspendu", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "cable-crunch", name: "Crunch poulie", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "ab-wheel", name: "Roue abdominale", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "russian-twist", name: "Russian twist", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "dead-bug", name: "Dead bug", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "hollow-hold", name: "Hollow hold", primary: "abdos", muscles: ["abdos"], category: "abdos" },
];
