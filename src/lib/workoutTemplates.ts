// Templates de séance et programmes prêts à l'emploi.
// Les charges sont à 0 par défaut : elles sont préremplies à partir de
// l'historique réel de l'utilisateur, jamais inventées.

export type SetSpec = { reps: number; weight_kg: number };
export type WorkoutExercise = { name: string; muscle_groups: string[]; sets: SetSpec[] };
export type Template = {
  id: string;
  name: string;
  muscle_groups: string[];
  restSec: number;
  exercises: WorkoutExercise[];
};

/** Raccourci : n séries de r reps, charge à 0 (préremplie ensuite). */
const ex = (name: string, muscle_groups: string[], sets: number, reps: number): WorkoutExercise => ({
  name,
  muscle_groups,
  sets: Array.from({ length: sets }, () => ({ reps, weight_kg: 0 })),
});

export const TEMPLATES: Template[] = [
  {
    id: "push",
    name: "Push · Pecs / Épaules / Triceps",
    muscle_groups: ["pectoraux", "epaules", "triceps"],
    restSec: 90,
    exercises: [
      ex("Développé couché barre", ["pectoraux", "triceps"], 4, 8),
      ex("Développé incliné haltères", ["pectoraux", "epaules"], 3, 10),
      ex("Développé militaire barre", ["epaules", "triceps"], 3, 8),
      ex("Élévations latérales haltères", ["epaules"], 3, 15),
      ex("Extension triceps poulie barre", ["triceps"], 3, 12),
    ],
  },
  {
    id: "pull",
    name: "Pull · Dos / Biceps",
    muscle_groups: ["dos", "biceps"],
    restSec: 90,
    exercises: [
      ex("Tirage vertical prise large", ["dos", "biceps"], 4, 10),
      ex("Rowing barre buste penché", ["dos", "biceps"], 4, 8),
      ex("Tirage horizontal poulie", ["dos", "biceps"], 3, 12),
      ex("Face pull", ["epaules", "dos"], 3, 15),
      ex("Curl barre", ["biceps"], 3, 10),
    ],
  },
  {
    id: "legs",
    name: "Legs · Jambes / Fessiers",
    muscle_groups: ["quadriceps", "fessiers", "ischios", "mollets"],
    restSec: 120,
    exercises: [
      ex("Squat barre (back squat)", ["quadriceps", "fessiers"], 4, 6),
      ex("Presse à cuisses", ["quadriceps", "fessiers"], 3, 12),
      ex("Soulevé de terre roumain", ["ischios", "fessiers"], 3, 10),
      ex("Leg curl assis", ["ischios"], 3, 12),
      ex("Mollets debout", ["mollets"], 4, 15),
    ],
  },
  {
    id: "upper",
    name: "Upper · Haut du corps",
    muscle_groups: ["pectoraux", "dos", "epaules", "biceps", "triceps"],
    restSec: 90,
    exercises: [
      ex("Développé couché barre", ["pectoraux", "triceps"], 4, 8),
      ex("Rowing barre buste penché", ["dos", "biceps"], 4, 8),
      ex("Développé épaules haltères", ["epaules", "triceps"], 3, 10),
      ex("Tirage vertical prise large", ["dos", "biceps"], 3, 10),
      ex("Curl haltères", ["biceps"], 3, 12),
      ex("Extension triceps corde", ["triceps"], 3, 12),
    ],
  },
  {
    id: "lower",
    name: "Lower · Bas du corps",
    muscle_groups: ["quadriceps", "ischios", "fessiers", "mollets"],
    restSec: 120,
    exercises: [
      ex("Squat barre (back squat)", ["quadriceps", "fessiers"], 4, 8),
      ex("Hip thrust barre", ["fessiers", "ischios"], 3, 10),
      ex("Leg extension", ["quadriceps"], 3, 12),
      ex("Leg curl allongé", ["ischios"], 3, 12),
      ex("Mollets assis", ["mollets"], 4, 15),
    ],
  },
  {
    id: "fullbody",
    name: "Full Body · Corps entier",
    muscle_groups: ["quadriceps", "pectoraux", "dos", "epaules", "abdos"],
    restSec: 90,
    exercises: [
      ex("Squat barre (back squat)", ["quadriceps", "fessiers"], 3, 8),
      ex("Développé couché barre", ["pectoraux", "triceps"], 3, 8),
      ex("Tirage vertical prise large", ["dos", "biceps"], 3, 10),
      ex("Développé épaules haltères", ["epaules", "triceps"], 3, 10),
      ex("Gainage planche", ["abdos"], 3, 1),
    ],
  },
];

export type Program = {
  id: string;
  name: string;
  subtitle: string;
  days: { label: string; templateId: string }[];
};

/** Programmes prêts à l'emploi — chaque jour reste éditable avant démarrage. */
export const PROGRAMS: Program[] = [
  {
    id: "fullbody3",
    name: "Full Body débutant",
    subtitle: "3 séances / semaine",
    days: [
      { label: "Jour 1", templateId: "fullbody" },
      { label: "Jour 2", templateId: "fullbody" },
      { label: "Jour 3", templateId: "fullbody" },
    ],
  },
  {
    id: "upperlower4",
    name: "Haut / Bas",
    subtitle: "4 séances / semaine",
    days: [
      { label: "Upper", templateId: "upper" },
      { label: "Lower", templateId: "lower" },
      { label: "Upper", templateId: "upper" },
      { label: "Lower", templateId: "lower" },
    ],
  },
  {
    id: "ppl",
    name: "Push Pull Legs",
    subtitle: "3 à 6 séances / semaine",
    days: [
      { label: "Push", templateId: "push" },
      { label: "Pull", templateId: "pull" },
      { label: "Legs", templateId: "legs" },
    ],
  },
];

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Normalise les groupes musculaires vers les clés utilisées par recovery.ts. */
export function normalizeMuscle(g: string): string {
  const s = g.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map: Record<string, string> = {
    "epaules": "epaules",
    "epaule": "epaules",
    "avant-bras": "avant_bras",
    "avant_bras": "avant_bras",
  };
  return map[s] ?? s;
}
