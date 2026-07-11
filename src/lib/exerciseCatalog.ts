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
  image_url?: string; // photo officielle (free-exercise-db, domaine public)
};

/**
 * Images officielles issues du dataset public free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, licence Unlicense).
 * Une entrée par id d'exercice de la bibliothèque ci-dessous.
 */
const FREE_EXDB = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const IMG: Record<string, string> = {
  "bench": "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
  "incline-bench": "Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
  "incline-db": "Incline_Dumbbell_Press/0.jpg",
  "decline-bench": "Decline_Barbell_Bench_Press/0.jpg",
  "dumbbell-fly": "Dumbbell_Flyes/0.jpg",
  "cable-crossover": "Cable_Crossover/0.jpg",
  "dips": "Dips_-_Chest_Version/0.jpg",
  "push-up": "Pushups/0.jpg",
  "deadlift": "Barbell_Deadlift/0.jpg",
  "pull-up": "Pullups/0.jpg",
  "chin-up": "Chin-Up/0.jpg",
  "row-barbell": "Bent_Over_Barbell_Row/0.jpg",
  "row-dumbbell": "One-Arm_Dumbbell_Row/0.jpg",
  "t-bar-row": "T-Bar_Row_with_Handle/0.jpg",
  "lat-pulldown": "Wide-Grip_Lat_Pulldown/0.jpg",
  "seated-row": "Seated_Cable_Rows/0.jpg",
  "shrugs": "Barbell_Shrug/0.jpg",
  "squat": "Barbell_Squat/0.jpg",
  "front-squat": "Front_Squat_Clean_Grip/0.jpg",
  "bulgarian": "Split_Squat_with_Dumbbells/0.jpg",
  "walking-lunge": "Dumbbell_Lunges/0.jpg",
  "leg-press": "Leg_Press/0.jpg",
  "leg-extension": "Leg_Extensions/0.jpg",
  "hip-thrust": "Barbell_Hip_Thrust/0.jpg",
  "leg-curl": "Lying_Leg_Curls/0.jpg",
  "rdl": "Romanian_Deadlift/0.jpg",
  "calf-raise": "Standing_Calf_Raises/0.jpg",
  "ohp": "Standing_Military_Press/0.jpg",
  "db-press": "Seated_Dumbbell_Press/0.jpg",
  "arnold": "Arnold_Dumbbell_Press/0.jpg",
  "lateral-raise": "Side_Lateral_Raise/0.jpg",
  "front-raise": "Front_Dumbbell_Raise/0.jpg",
  "rear-delt-fly": "Reverse_Flyes/0.jpg",
  "face-pull": "Face_Pull/0.jpg",
  "upright-row": "Upright_Barbell_Row/0.jpg",
  "curl-barbell": "Barbell_Curl/0.jpg",
  "curl-dumbbell": "Dumbbell_Bicep_Curl/0.jpg",
  "hammer-curl": "Hammer_Curls/0.jpg",
  "preacher-curl": "Preacher_Curl/0.jpg",
  "tricep-pushdown": "Triceps_Pushdown/0.jpg",
  "tricep-extension": "Standing_Dumbbell_Triceps_Extension/0.jpg",
  "skullcrusher": "EZ-Bar_Skullcrusher/0.jpg",
  "close-grip-bench": "Close-Grip_Barbell_Bench_Press/0.jpg",
  "forearm-curl": "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg",
  "plank": "Plank/0.jpg",
  "side-plank": "Side_Bridge/0.jpg",
  "hanging-leg-raise": "Hanging_Leg_Raise/0.jpg",
  "cable-crunch": "Cable_Crunch/0.jpg",
  "ab-wheel": "Ab_Roller/0.jpg",
  "russian-twist": "Russian_Twist/0.jpg",
  "dead-bug": "Dead_Bug/0.jpg",
  "hollow-hold": "Plank/0.jpg",
};

const imageFor = (id: string): string | undefined =>
  IMG[id] ? FREE_EXDB + IMG[id] : undefined;

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

export const EXERCISE_LIBRARY: LibraryExercise[] = ([
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
] as LibraryExercise[]).map((e) => ({ ...e, image_url: imageFor(e.id) }));

/** Retrouve l'image officielle d'un exercice à partir de son nom d'affichage. */
export function imageForExerciseName(name: string): string | undefined {
  const norm = name.trim().toLowerCase();
  const hit = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === norm);
  if (hit?.image_url) return hit.image_url;
  // fallback: contains
  const loose = EXERCISE_LIBRARY.find(
    (e) => norm.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(norm),
  );
  return loose?.image_url;
}

/** Image officielle pour les 3 exercices du log de PR. */
export const PR_EXERCISE_IMAGE: Record<"squat" | "bench" | "deadlift", string> = {
  squat: FREE_EXDB + IMG["squat"],
  bench: FREE_EXDB + IMG["bench"],
  deadlift: FREE_EXDB + IMG["deadlift"],
};
