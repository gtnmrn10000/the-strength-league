// Bibliothèque d'exercices CENTURIA — couverture salle complète.
// `muscles` n'utilise QUE les clés canoniques de recovery.ts (11 groupes),
// `focus` décrit le détail affichable (trapèzes, adducteurs, deltoïde arrière…).
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

export type MuscleCategory =
  | "pectoraux"
  | "dos"
  | "jambes"
  | "epaules"
  | "bras"
  | "abdos";

export type Equipment =
  | "barre"
  | "halteres"
  | "poulie"
  | "machine"
  | "smith"
  | "poids_du_corps"
  | "kettlebell"
  | "elastique";

export type Difficulty = "debutant" | "intermediaire" | "avance";

export type LibraryExercise = {
  id: string;
  name: string;
  aliases: string[];
  primary: string; // muscle principal (clé recovery)
  muscles: string[]; // muscles sollicités (clés recovery)
  focus?: string; // détail lisible (ex: "Trapèzes", "Adducteurs")
  category: MuscleCategory;
  equipment: Equipment;
  difficulty: Difficulty;
  image_url?: string;
  custom?: boolean;
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barre: "Barre",
  halteres: "Haltères",
  poulie: "Poulie",
  machine: "Machine",
  smith: "Smith",
  poids_du_corps: "Poids du corps",
  kettlebell: "Kettlebell",
  elastique: "Élastique",
};

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

/**
 * Images officielles issues du dataset public free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, licence Unlicense).
 * Seuls les ids listés ici ont une image : les autres tombent sur le
 * fallback iconographique (jamais d'URL cassée).
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

type Row = {
  id: string;
  name: string;
  cat: MuscleCategory;
  primary: string;
  muscles?: string[];
  eq: Equipment;
  diff?: Difficulty;
  focus?: string;
  alias?: string[];
};

const ROWS: Row[] = [
  /* ---------------- PECTORAUX (26) ---------------- */
  { id: "bench", name: "Développé couché barre", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps", "epaules"], eq: "barre", alias: ["bench press", "dc", "bench"] },
  { id: "bench-wide", name: "Développé couché prise large", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "barre", alias: ["wide bench"] },
  { id: "incline-bench", name: "Développé incliné barre", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "barre", alias: ["incline bench", "di barre"] },
  { id: "decline-bench", name: "Développé décliné barre", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "barre", alias: ["decline bench"] },
  { id: "db-bench", name: "Développé couché haltères", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "halteres", alias: ["dumbbell press", "dc halteres"] },
  { id: "incline-db", name: "Développé incliné haltères", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "halteres", alias: ["incline dumbbell press"] },
  { id: "decline-db", name: "Développé décliné haltères", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "halteres" },
  { id: "smith-bench", name: "Développé couché Smith", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "smith", alias: ["smith machine bench"] },
  { id: "smith-incline", name: "Développé incliné Smith", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "smith" },
  { id: "chest-press", name: "Chest press machine", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "machine", diff: "debutant", alias: ["presse pectoraux", "chest press"] },
  { id: "incline-chest-press", name: "Chest press incliné machine", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "machine", diff: "debutant" },
  { id: "converging-press", name: "Presse convergente pectoraux", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "machine", alias: ["convergente", "hammer strength press"] },
  { id: "pec-deck", name: "Pec deck (butterfly)", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux"], eq: "machine", diff: "debutant", alias: ["butterfly", "peck deck"] },
  { id: "dumbbell-fly", name: "Écarté haltères", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux"], eq: "halteres", alias: ["fly", "ecarte"] },
  { id: "incline-fly", name: "Écarté incliné haltères", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux"], eq: "halteres" },
  { id: "cable-crossover", name: "Écarté poulie haute", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux"], eq: "poulie", alias: ["crossover", "cable crossover"] },
  { id: "cable-fly-low", name: "Écarté poulie basse", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "poulie" },
  { id: "cable-press", name: "Développé poulie debout", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "poulie" },
  { id: "dips", name: "Dips pectoraux", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "poids_du_corps", diff: "avance", alias: ["dips"] },
  { id: "push-up", name: "Pompes", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "poids_du_corps", diff: "debutant", alias: ["pushup", "push up"] },
  { id: "push-up-incline", name: "Pompes inclinées", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux"], eq: "poids_du_corps", diff: "debutant" },
  { id: "push-up-decline", name: "Pompes déclinées", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "epaules"], eq: "poids_du_corps" },
  { id: "diamond-push-up", name: "Pompes diamant", cat: "pectoraux", primary: "triceps", muscles: ["triceps", "pectoraux"], eq: "poids_du_corps" },
  { id: "pullover-db", name: "Pull-over haltère", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "dos"], eq: "halteres", alias: ["pullover"] },
  { id: "pullover-cable", name: "Pull-over poulie", cat: "pectoraux", primary: "dos", muscles: ["dos", "pectoraux"], eq: "poulie" },
  { id: "band-chest-press", name: "Développé élastique", cat: "pectoraux", primary: "pectoraux", muscles: ["pectoraux", "triceps"], eq: "elastique", diff: "debutant" },

  /* ---------------- DOS + TRAPÈZES (32) ---------------- */
  { id: "deadlift", name: "Soulevé de terre", cat: "dos", primary: "dos", muscles: ["dos", "ischios", "fessiers"], eq: "barre", diff: "avance", alias: ["deadlift", "sdt"] },
  { id: "sumo-deadlift", name: "Soulevé de terre sumo", cat: "dos", primary: "dos", muscles: ["dos", "fessiers", "quadriceps"], eq: "barre", diff: "avance", alias: ["sumo"] },
  { id: "trap-bar-deadlift", name: "Soulevé de terre trap bar", cat: "dos", primary: "dos", muscles: ["dos", "quadriceps", "fessiers"], eq: "barre", alias: ["trap bar"] },
  { id: "rack-pull", name: "Rack pull", cat: "dos", primary: "dos", muscles: ["dos", "ischios"], eq: "barre" },
  { id: "pull-up", name: "Tractions pronation", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poids_du_corps", diff: "avance", alias: ["pull up", "traction"] },
  { id: "chin-up", name: "Tractions supination", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poids_du_corps", diff: "avance", alias: ["chin up"] },
  { id: "neutral-pull-up", name: "Tractions prise neutre", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poids_du_corps", diff: "avance" },
  { id: "assisted-pull-up", name: "Tractions assistées machine", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "machine", diff: "debutant" },
  { id: "lat-pulldown", name: "Tirage vertical prise large", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poulie", diff: "debutant", alias: ["lat pulldown", "tirage poitrine"] },
  { id: "pulldown-supine", name: "Tirage vertical supination", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poulie" },
  { id: "pulldown-neutral", name: "Tirage vertical prise neutre", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poulie" },
  { id: "pulldown-unilateral", name: "Tirage vertical unilatéral", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poulie" },
  { id: "straight-arm-pulldown", name: "Pull-over poulie haute bras tendus", cat: "dos", primary: "dos", muscles: ["dos"], eq: "poulie", alias: ["straight arm"] },
  { id: "row-barbell", name: "Rowing barre buste penché", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "barre", alias: ["barbell row", "rowing"] },
  { id: "pendlay-row", name: "Pendlay row", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "barre", diff: "avance" },
  { id: "row-yates", name: "Rowing Yates supination", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "barre" },
  { id: "row-dumbbell", name: "Rowing haltère un bras", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "halteres", diff: "debutant", alias: ["one arm row"] },
  { id: "row-dumbbell-bench", name: "Rowing haltères buste penché", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "halteres" },
  { id: "chest-supported-row", name: "Rowing buste soutenu", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "machine", diff: "debutant" },
  { id: "t-bar-row", name: "T-bar row", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "barre", alias: ["t bar"] },
  { id: "seated-row", name: "Tirage horizontal poulie", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poulie", diff: "debutant", alias: ["seated row", "rowing assis"] },
  { id: "row-machine", name: "Rowing machine convergente", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "machine", diff: "debutant" },
  { id: "low-row-unilateral", name: "Tirage horizontal unilatéral", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poulie" },
  { id: "smith-row", name: "Rowing Smith machine", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "smith" },
  { id: "inverted-row", name: "Rowing australien", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "poids_du_corps", diff: "debutant" },
  { id: "kb-row", name: "Rowing kettlebell", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "kettlebell" },
  { id: "band-row", name: "Tirage élastique", cat: "dos", primary: "dos", muscles: ["dos", "biceps"], eq: "elastique", diff: "debutant" },
  { id: "shrugs", name: "Shrugs barre", cat: "dos", primary: "dos", muscles: ["dos"], focus: "Trapèzes", eq: "barre", diff: "debutant", alias: ["shrug", "haussement epaules"] },
  { id: "shrugs-db", name: "Shrugs haltères", cat: "dos", primary: "dos", muscles: ["dos"], focus: "Trapèzes", eq: "halteres", diff: "debutant" },
  { id: "shrugs-smith", name: "Shrugs Smith machine", cat: "dos", primary: "dos", muscles: ["dos"], focus: "Trapèzes", eq: "smith" },
  { id: "hyperextension", name: "Extension lombaire (banc 45°)", cat: "dos", primary: "dos", muscles: ["dos", "fessiers", "ischios"], focus: "Lombaires", eq: "poids_du_corps", diff: "debutant", alias: ["hyperextension", "lombaire"] },
  { id: "good-morning", name: "Good morning", cat: "dos", primary: "ischios", muscles: ["ischios", "dos", "fessiers"], eq: "barre", diff: "avance" },

  /* ---------------- ÉPAULES (24) ---------------- */
  { id: "ohp", name: "Développé militaire barre", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "barre", alias: ["ohp", "military press", "dm"] },
  { id: "seated-ohp", name: "Développé militaire assis", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "barre" },
  { id: "db-press", name: "Développé épaules haltères", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "halteres", diff: "debutant", alias: ["shoulder press"] },
  { id: "arnold", name: "Arnold press", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "halteres" },
  { id: "smith-ohp", name: "Développé épaules Smith", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "smith" },
  { id: "shoulder-press-machine", name: "Développé épaules machine", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "machine", diff: "debutant" },
  { id: "push-press", name: "Push press", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps", "quadriceps"], eq: "barre", diff: "avance" },
  { id: "landmine-press", name: "Landmine press", cat: "epaules", primary: "epaules", muscles: ["epaules", "pectoraux"], eq: "barre" },
  { id: "lateral-raise", name: "Élévations latérales haltères", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde latéral", eq: "halteres", diff: "debutant", alias: ["lateral raise", "elevations laterales"] },
  { id: "lateral-raise-cable", name: "Élévations latérales poulie", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde latéral", eq: "poulie" },
  { id: "lateral-raise-machine", name: "Élévations latérales machine", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde latéral", eq: "machine", diff: "debutant" },
  { id: "lateral-raise-band", name: "Élévations latérales élastique", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde latéral", eq: "elastique", diff: "debutant" },
  { id: "lean-away-raise", name: "Élévations latérales penché", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde latéral", eq: "halteres" },
  { id: "front-raise", name: "Élévations frontales haltères", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde avant", eq: "halteres", diff: "debutant" },
  { id: "front-raise-cable", name: "Élévations frontales poulie", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde avant", eq: "poulie" },
  { id: "front-raise-plate", name: "Élévations frontales disque", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde avant", eq: "barre", diff: "debutant" },
  { id: "rear-delt-fly", name: "Oiseau haltères", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde arrière", eq: "halteres", alias: ["rear delt", "oiseau"] },
  { id: "rear-delt-machine", name: "Pec deck inversé", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde arrière", eq: "machine", diff: "debutant", alias: ["reverse pec deck"] },
  { id: "rear-delt-cable", name: "Oiseau poulie croisée", cat: "epaules", primary: "epaules", muscles: ["epaules"], focus: "Deltoïde arrière", eq: "poulie" },
  { id: "face-pull", name: "Face pull", cat: "epaules", primary: "epaules", muscles: ["epaules", "dos"], focus: "Deltoïde arrière", eq: "poulie", alias: ["face pull"] },
  { id: "upright-row", name: "Rowing menton barre", cat: "epaules", primary: "epaules", muscles: ["epaules", "dos"], eq: "barre" },
  { id: "upright-row-cable", name: "Rowing menton poulie", cat: "epaules", primary: "epaules", muscles: ["epaules", "dos"], eq: "poulie" },
  { id: "kb-press", name: "Développé kettlebell", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "kettlebell" },
  { id: "pike-push-up", name: "Pompes piquées", cat: "epaules", primary: "epaules", muscles: ["epaules", "triceps"], eq: "poids_du_corps" },

  /* ---------------- BRAS : BICEPS / TRICEPS / AVANT-BRAS (32) ---------------- */
  { id: "curl-barbell", name: "Curl barre", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "barre", diff: "debutant", alias: ["barbell curl"] },
  { id: "curl-ez", name: "Curl barre EZ", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "barre", diff: "debutant" },
  { id: "curl-dumbbell", name: "Curl haltères", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "halteres", diff: "debutant" },
  { id: "curl-incline", name: "Curl incliné haltères", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "halteres" },
  { id: "hammer-curl", name: "Curl marteau", cat: "bras", primary: "biceps", muscles: ["biceps", "avant_bras"], eq: "halteres", diff: "debutant", alias: ["hammer"] },
  { id: "curl-concentration", name: "Curl concentration", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "halteres" },
  { id: "preacher-curl", name: "Curl pupitre barre", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "barre", alias: ["preacher", "larry scott"] },
  { id: "preacher-curl-machine", name: "Curl pupitre machine", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "machine", diff: "debutant" },
  { id: "curl-cable", name: "Curl poulie basse", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "poulie", diff: "debutant" },
  { id: "curl-cable-high", name: "Curl poulie haute (double biceps)", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "poulie" },
  { id: "curl-rope", name: "Curl corde poulie", cat: "bras", primary: "biceps", muscles: ["biceps", "avant_bras"], eq: "poulie" },
  { id: "spider-curl", name: "Spider curl", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "halteres" },
  { id: "drag-curl", name: "Drag curl", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "barre" },
  { id: "curl-band", name: "Curl élastique", cat: "bras", primary: "biceps", muscles: ["biceps"], eq: "elastique", diff: "debutant" },
  { id: "tricep-pushdown", name: "Extension triceps poulie barre", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "poulie", diff: "debutant", alias: ["pushdown"] },
  { id: "tricep-pushdown-rope", name: "Extension triceps corde", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "poulie", diff: "debutant" },
  { id: "tricep-pushdown-reverse", name: "Extension triceps prise inversée", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "poulie" },
  { id: "tricep-extension", name: "Extension nuque haltère", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "halteres" },
  { id: "overhead-rope-ext", name: "Extension nuque corde poulie", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "poulie" },
  { id: "skullcrusher", name: "Barre au front (skullcrusher)", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "barre", alias: ["skullcrusher", "barre au front"] },
  { id: "close-grip-bench", name: "Développé couché prise serrée", cat: "bras", primary: "triceps", muscles: ["triceps", "pectoraux"], eq: "barre", alias: ["close grip"] },
  { id: "jm-press", name: "JM press", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "barre", diff: "avance" },
  { id: "kickback", name: "Kickback triceps haltère", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "halteres", diff: "debutant" },
  { id: "kickback-cable", name: "Kickback triceps poulie", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "poulie" },
  { id: "dips-bench", name: "Dips sur banc", cat: "bras", primary: "triceps", muscles: ["triceps", "pectoraux"], eq: "poids_du_corps", diff: "debutant" },
  { id: "dips-machine", name: "Dips machine assistée", cat: "bras", primary: "triceps", muscles: ["triceps", "pectoraux"], eq: "machine", diff: "debutant" },
  { id: "tricep-extension-machine", name: "Extension triceps machine", cat: "bras", primary: "triceps", muscles: ["triceps"], eq: "machine", diff: "debutant" },
  { id: "forearm-curl", name: "Curl poignets barre", cat: "bras", primary: "avant_bras", muscles: ["avant_bras"], eq: "barre", diff: "debutant" },
  { id: "reverse-curl", name: "Curl inversé barre", cat: "bras", primary: "avant_bras", muscles: ["avant_bras", "biceps"], eq: "barre" },
  { id: "wrist-extension", name: "Extension poignets", cat: "bras", primary: "avant_bras", muscles: ["avant_bras"], eq: "halteres", diff: "debutant" },
  { id: "farmer-walk", name: "Farmer walk", cat: "bras", primary: "avant_bras", muscles: ["avant_bras", "dos"], eq: "halteres" },
  { id: "dead-hang", name: "Suspension à la barre", cat: "bras", primary: "avant_bras", muscles: ["avant_bras", "dos"], eq: "poids_du_corps", diff: "debutant" },

  /* ---------------- JAMBES (46) ---------------- */
  { id: "squat", name: "Squat barre (back squat)", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers", "dos"], eq: "barre", alias: ["back squat", "squat"] },
  { id: "front-squat", name: "Front squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "abdos"], eq: "barre", diff: "avance" },
  { id: "high-bar-squat", name: "Squat barre haute", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "barre" },
  { id: "low-bar-squat", name: "Squat barre basse", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers", "dos"], eq: "barre", diff: "avance" },
  { id: "pause-squat", name: "Squat avec pause", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "barre", diff: "avance" },
  { id: "box-squat", name: "Box squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "barre" },
  { id: "smith-squat", name: "Squat Smith machine", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "smith", diff: "debutant" },
  { id: "goblet-squat", name: "Goblet squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "kettlebell", diff: "debutant" },
  { id: "hack-squat", name: "Hack squat machine", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "machine", alias: ["hacksquat"] },
  { id: "pendulum-squat", name: "Pendulum squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "machine" },
  { id: "belt-squat", name: "Belt squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "machine" },
  { id: "leg-press", name: "Presse à cuisses", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "machine", diff: "debutant", alias: ["leg press", "presse"] },
  { id: "leg-press-high", name: "Presse pieds hauts (fessiers/ischios)", cat: "jambes", primary: "fessiers", muscles: ["fessiers", "ischios"], eq: "machine" },
  { id: "leg-press-narrow", name: "Presse pieds serrés (quadriceps)", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps"], eq: "machine" },
  { id: "leg-press-unilateral", name: "Presse unilatérale", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "machine" },
  { id: "leg-extension", name: "Leg extension", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps"], eq: "machine", diff: "debutant", alias: ["leg extension"] },
  { id: "leg-extension-uni", name: "Leg extension unilatéral", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps"], eq: "machine" },
  { id: "sissy-squat", name: "Sissy squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps"], eq: "poids_du_corps", diff: "avance" },
  { id: "bulgarian", name: "Fentes bulgares", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "halteres", alias: ["bulgarian split squat"] },
  { id: "walking-lunge", name: "Fentes marchées", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "halteres" },
  { id: "reverse-lunge", name: "Fentes arrière", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "halteres", diff: "debutant" },
  { id: "static-lunge", name: "Fentes statiques", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "halteres", diff: "debutant" },
  { id: "step-up", name: "Step-up sur banc", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "halteres", diff: "debutant" },
  { id: "split-squat-smith", name: "Fentes Smith machine", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "smith" },
  { id: "pistol-squat", name: "Pistol squat", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "fessiers"], eq: "poids_du_corps", diff: "avance" },
  { id: "wall-sit", name: "Chaise murale", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps"], eq: "poids_du_corps", diff: "debutant" },
  { id: "rdl", name: "Soulevé de terre roumain", cat: "jambes", primary: "ischios", muscles: ["ischios", "fessiers", "dos"], eq: "barre", alias: ["rdl", "romanian deadlift"] },
  { id: "rdl-db", name: "Soulevé de terre roumain haltères", cat: "jambes", primary: "ischios", muscles: ["ischios", "fessiers"], eq: "halteres" },
  { id: "stiff-leg-deadlift", name: "Soulevé de terre jambes tendues", cat: "jambes", primary: "ischios", muscles: ["ischios", "dos"], eq: "barre" },
  { id: "single-leg-rdl", name: "RDL unilatéral", cat: "jambes", primary: "ischios", muscles: ["ischios", "fessiers"], eq: "halteres", diff: "avance" },
  { id: "leg-curl", name: "Leg curl allongé", cat: "jambes", primary: "ischios", muscles: ["ischios"], eq: "machine", diff: "debutant", alias: ["lying leg curl"] },
  { id: "leg-curl-seated", name: "Leg curl assis", cat: "jambes", primary: "ischios", muscles: ["ischios"], eq: "machine", diff: "debutant" },
  { id: "leg-curl-standing", name: "Leg curl debout unilatéral", cat: "jambes", primary: "ischios", muscles: ["ischios"], eq: "machine" },
  { id: "nordic-curl", name: "Nordic hamstring curl", cat: "jambes", primary: "ischios", muscles: ["ischios"], eq: "poids_du_corps", diff: "avance" },
  { id: "hip-thrust", name: "Hip thrust barre", cat: "jambes", primary: "fessiers", muscles: ["fessiers", "ischios"], eq: "barre", alias: ["hip thrust"] },
  { id: "hip-thrust-machine", name: "Hip thrust machine", cat: "jambes", primary: "fessiers", muscles: ["fessiers", "ischios"], eq: "machine", diff: "debutant" },
  { id: "hip-thrust-smith", name: "Hip thrust Smith machine", cat: "jambes", primary: "fessiers", muscles: ["fessiers"], eq: "smith" },
  { id: "glute-bridge", name: "Pont fessier au sol", cat: "jambes", primary: "fessiers", muscles: ["fessiers"], eq: "poids_du_corps", diff: "debutant" },
  { id: "glute-kickback", name: "Kickback fessier poulie", cat: "jambes", primary: "fessiers", muscles: ["fessiers"], eq: "poulie", diff: "debutant" },
  { id: "glute-kickback-machine", name: "Kickback fessier machine", cat: "jambes", primary: "fessiers", muscles: ["fessiers"], eq: "machine", diff: "debutant" },
  { id: "cable-pull-through", name: "Pull-through poulie", cat: "jambes", primary: "fessiers", muscles: ["fessiers", "ischios"], eq: "poulie" },
  { id: "abduction-machine", name: "Abducteurs machine", cat: "jambes", primary: "fessiers", muscles: ["fessiers"], focus: "Abducteurs", eq: "machine", diff: "debutant", alias: ["abduction"] },
  { id: "abduction-cable", name: "Abduction poulie", cat: "jambes", primary: "fessiers", muscles: ["fessiers"], focus: "Abducteurs", eq: "poulie" },
  { id: "adduction-machine", name: "Adducteurs machine", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps"], focus: "Adducteurs", eq: "machine", diff: "debutant", alias: ["adduction"] },
  { id: "copenhagen-plank", name: "Copenhagen plank", cat: "jambes", primary: "quadriceps", muscles: ["quadriceps", "abdos"], focus: "Adducteurs", eq: "poids_du_corps", diff: "avance" },
  { id: "kb-swing", name: "Kettlebell swing", cat: "jambes", primary: "fessiers", muscles: ["fessiers", "ischios", "dos"], eq: "kettlebell" },
  { id: "calf-raise", name: "Mollets debout", cat: "jambes", primary: "mollets", muscles: ["mollets"], eq: "machine", diff: "debutant", alias: ["calf raise", "mollet"] },
  { id: "calf-raise-seated", name: "Mollets assis", cat: "jambes", primary: "mollets", muscles: ["mollets"], eq: "machine", diff: "debutant" },
  { id: "calf-press", name: "Mollets à la presse", cat: "jambes", primary: "mollets", muscles: ["mollets"], eq: "machine", diff: "debutant" },
  { id: "calf-raise-smith", name: "Mollets Smith machine", cat: "jambes", primary: "mollets", muscles: ["mollets"], eq: "smith" },
  { id: "calf-raise-db", name: "Mollets haltères unilatéral", cat: "jambes", primary: "mollets", muscles: ["mollets"], eq: "halteres", diff: "debutant" },

  /* ---------------- ABDOS / CORE / LOMBAIRES (22) ---------------- */
  { id: "plank", name: "Gainage planche", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "debutant", alias: ["plank", "gainage"] },
  { id: "side-plank", name: "Gainage latéral", cat: "abdos", primary: "abdos", muscles: ["abdos"], focus: "Obliques", eq: "poids_du_corps", diff: "debutant" },
  { id: "hollow-hold", name: "Hollow hold", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps" },
  { id: "dead-bug", name: "Dead bug", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "debutant" },
  { id: "crunch", name: "Crunch au sol", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "debutant" },
  { id: "cable-crunch", name: "Crunch poulie à genoux", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poulie" },
  { id: "crunch-machine", name: "Crunch machine", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "machine", diff: "debutant" },
  { id: "sit-up", name: "Sit-up", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "debutant" },
  { id: "decline-sit-up", name: "Sit-up banc décliné", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps" },
  { id: "hanging-leg-raise", name: "Relevé de jambes suspendu", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "avance" },
  { id: "hanging-knee-raise", name: "Relevé de genoux suspendu", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps" },
  { id: "captain-chair", name: "Relevé de jambes chaise romaine", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "machine", diff: "debutant" },
  { id: "lying-leg-raise", name: "Relevé de jambes au sol", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "debutant" },
  { id: "ab-wheel", name: "Roue abdominale", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "avance" },
  { id: "russian-twist", name: "Russian twist", cat: "abdos", primary: "abdos", muscles: ["abdos"], focus: "Obliques", eq: "poids_du_corps", diff: "debutant" },
  { id: "cable-woodchop", name: "Woodchopper poulie", cat: "abdos", primary: "abdos", muscles: ["abdos"], focus: "Obliques", eq: "poulie" },
  { id: "pallof-press", name: "Pallof press", cat: "abdos", primary: "abdos", muscles: ["abdos"], focus: "Anti-rotation", eq: "poulie" },
  { id: "side-bend", name: "Flexion latérale haltère", cat: "abdos", primary: "abdos", muscles: ["abdos"], focus: "Obliques", eq: "halteres", diff: "debutant" },
  { id: "mountain-climber", name: "Mountain climber", cat: "abdos", primary: "abdos", muscles: ["abdos"], eq: "poids_du_corps", diff: "debutant" },
  { id: "bird-dog", name: "Bird dog", cat: "abdos", primary: "abdos", muscles: ["abdos", "dos"], focus: "Lombaires", eq: "poids_du_corps", diff: "debutant" },
  { id: "superman", name: "Superman au sol", cat: "abdos", primary: "dos", muscles: ["dos"], focus: "Lombaires", eq: "poids_du_corps", diff: "debutant" },
  { id: "reverse-hyper", name: "Reverse hyperextension", cat: "abdos", primary: "fessiers", muscles: ["fessiers", "dos"], focus: "Lombaires", eq: "machine" },
];

export const EXERCISE_LIBRARY: LibraryExercise[] = ROWS.map((r) => ({
  id: r.id,
  name: r.name,
  aliases: r.alias ?? [],
  primary: r.primary,
  muscles: r.muscles ?? [r.primary],
  focus: r.focus,
  category: r.cat,
  equipment: r.eq,
  difficulty: r.diff ?? "intermediaire",
  image_url: imageFor(r.id),
}));

export const EXERCISE_COUNT = EXERCISE_LIBRARY.length;

/** Normalise une chaîne : minuscules, sans accents, sans ponctuation. */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Recherche tolérante aux accents + aliases (ex: "dc" → Développé couché). */
export function searchExercises(list: LibraryExercise[], query: string): LibraryExercise[] {
  const q = normalizeSearch(query);
  if (!q) return list;
  const terms = q.split(" ");
  return list.filter((e) => {
    const hay = normalizeSearch(
      [e.name, e.aliases.join(" "), e.focus ?? "", e.muscles.join(" "), EQUIPMENT_LABEL[e.equipment]].join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}

const BY_NAME = new Map<string, LibraryExercise>();
for (const e of EXERCISE_LIBRARY) BY_NAME.set(normalizeSearch(e.name), e);

export function findExerciseByName(name: string): LibraryExercise | undefined {
  const n = normalizeSearch(name);
  const exact = BY_NAME.get(n);
  if (exact) return exact;
  return EXERCISE_LIBRARY.find(
    (e) => n.includes(normalizeSearch(e.name)) || normalizeSearch(e.name).includes(n),
  );
}

/** Retrouve l'image officielle d'un exercice à partir de son nom d'affichage. */
export function imageForExerciseName(name: string): string | undefined {
  return findExerciseByName(name)?.image_url;
}

/** Image officielle pour les 3 exercices du log de PR. */
export const PR_EXERCISE_IMAGE: Record<"squat" | "bench" | "deadlift", string> = {
  squat: FREE_EXDB + IMG["squat"],
  bench: FREE_EXDB + IMG["bench"],
  deadlift: FREE_EXDB + IMG["deadlift"],
};
