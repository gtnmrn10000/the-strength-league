// Bibliothèque d'exercices — catégorisés par grand groupe musculaire visible.
// Chaque exercice cible un ou plusieurs muscles fins (clés recovery.ts).

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

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Pectoraux
  { id: "bench", name: "Bench Press", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },
  { id: "incline-bench", name: "Développé incliné", primary: "pectoraux", muscles: ["pectoraux", "epaules"], category: "pectoraux" },
  { id: "dumbbell-fly", name: "Écarté haltères", primary: "pectoraux", muscles: ["pectoraux"], category: "pectoraux" },
  { id: "dips", name: "Dips", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },
  { id: "push-up", name: "Pompes", primary: "pectoraux", muscles: ["pectoraux", "triceps"], category: "pectoraux" },

  // Dos
  { id: "deadlift", name: "Deadlift", primary: "dos", muscles: ["dos", "ischios", "fessiers"], category: "dos" },
  { id: "pull-up", name: "Tractions", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "row-barbell", name: "Rowing barre", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },
  { id: "row-dumbbell", name: "Rowing haltère", primary: "dos", muscles: ["dos"], category: "dos" },
  { id: "lat-pulldown", name: "Tirage vertical", primary: "dos", muscles: ["dos", "biceps"], category: "dos" },

  // Jambes
  { id: "squat", name: "Squat", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "front-squat", name: "Front squat", primary: "quadriceps", muscles: ["quadriceps", "abdos"], category: "jambes" },
  { id: "bulgarian", name: "Fentes bulgares", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "leg-press", name: "Presse à cuisses", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], category: "jambes" },
  { id: "hip-thrust", name: "Hip thrust", primary: "fessiers", muscles: ["fessiers", "ischios"], category: "jambes" },
  { id: "leg-curl", name: "Leg curl", primary: "ischios", muscles: ["ischios"], category: "jambes" },
  { id: "rdl", name: "Soulevé de terre roumain", primary: "ischios", muscles: ["ischios", "fessiers"], category: "jambes" },
  { id: "calf-raise", name: "Mollets debout", primary: "mollets", muscles: ["mollets"], category: "jambes" },

  // Épaules
  { id: "ohp", name: "Développé militaire", primary: "epaules", muscles: ["epaules", "triceps"], category: "epaules" },
  { id: "lateral-raise", name: "Élévations latérales", primary: "epaules", muscles: ["epaules"], category: "epaules" },
  { id: "face-pull", name: "Face pull", primary: "epaules", muscles: ["epaules", "dos"], category: "epaules" },
  { id: "arnold", name: "Arnold press", primary: "epaules", muscles: ["epaules"], category: "epaules" },

  // Bras
  { id: "curl-barbell", name: "Curl barre", primary: "biceps", muscles: ["biceps"], category: "bras" },
  { id: "hammer-curl", name: "Curl marteau", primary: "biceps", muscles: ["biceps", "avant_bras"], category: "bras" },
  { id: "tricep-extension", name: "Extension triceps", primary: "triceps", muscles: ["triceps"], category: "bras" },
  { id: "skullcrusher", name: "Skullcrusher", primary: "triceps", muscles: ["triceps"], category: "bras" },
  { id: "forearm-curl", name: "Curl avant-bras", primary: "avant_bras", muscles: ["avant_bras"], category: "bras" },

  // Abdos
  { id: "plank", name: "Gainage", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "hanging-leg-raise", name: "Relevé de jambes suspendu", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "cable-crunch", name: "Crunch poulie", primary: "abdos", muscles: ["abdos"], category: "abdos" },
  { id: "ab-wheel", name: "Roue abdominale", primary: "abdos", muscles: ["abdos"], category: "abdos" },
];
