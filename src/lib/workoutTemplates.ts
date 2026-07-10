// Templates de séance partagés entre le Training et le WorkoutLogger.

export type SetSpec = { reps: number; weight_kg: number };
export type WorkoutExercise = { name: string; muscle_groups: string[]; sets: SetSpec[] };
export type Template = {
  id: string;
  name: string;
  muscle_groups: string[];
  restSec: number;
  exercises: WorkoutExercise[];
};

export const TEMPLATES: Template[] = [
  {
    id: "push",
    name: "Push · Pecs / Épaules / Triceps",
    muscle_groups: ["pectoraux", "epaules", "triceps"],
    restSec: 90,
    exercises: [
      { name: "Bench Press", muscle_groups: ["pectoraux"], sets: [
        { reps: 8, weight_kg: 60 }, { reps: 8, weight_kg: 60 }, { reps: 8, weight_kg: 60 }, { reps: 6, weight_kg: 65 },
      ]},
      { name: "Développé militaire", muscle_groups: ["epaules"], sets: [
        { reps: 10, weight_kg: 40 }, { reps: 10, weight_kg: 40 }, { reps: 8, weight_kg: 45 },
      ]},
      { name: "Dips", muscle_groups: ["triceps", "pectoraux"], sets: [
        { reps: 10, weight_kg: 0 }, { reps: 10, weight_kg: 0 }, { reps: 8, weight_kg: 0 },
      ]},
    ],
  },
  {
    id: "pull",
    name: "Pull · Dos / Biceps",
    muscle_groups: ["dos", "biceps"],
    restSec: 90,
    exercises: [
      { name: "Deadlift", muscle_groups: ["dos", "ischios"], sets: [
        { reps: 5, weight_kg: 100 }, { reps: 5, weight_kg: 100 }, { reps: 5, weight_kg: 110 },
      ]},
      { name: "Tractions", muscle_groups: ["dos"], sets: [
        { reps: 8, weight_kg: 0 }, { reps: 8, weight_kg: 0 }, { reps: 6, weight_kg: 0 },
      ]},
      { name: "Rowing barre", muscle_groups: ["dos"], sets: [
        { reps: 10, weight_kg: 50 }, { reps: 10, weight_kg: 50 }, { reps: 8, weight_kg: 55 },
      ]},
      { name: "Curl barre", muscle_groups: ["biceps"], sets: [
        { reps: 12, weight_kg: 25 }, { reps: 10, weight_kg: 30 }, { reps: 8, weight_kg: 32 },
      ]},
    ],
  },
  {
    id: "legs",
    name: "Legs · Jambes / Fessiers",
    muscle_groups: ["quadriceps", "fessiers", "ischios"],
    restSec: 120,
    exercises: [
      { name: "Squat", muscle_groups: ["quadriceps", "fessiers"], sets: [
        { reps: 6, weight_kg: 90 }, { reps: 6, weight_kg: 95 }, { reps: 6, weight_kg: 100 }, { reps: 4, weight_kg: 105 },
      ]},
      { name: "Fentes bulgares", muscle_groups: ["quadriceps"], sets: [
        { reps: 10, weight_kg: 20 }, { reps: 10, weight_kg: 20 }, { reps: 10, weight_kg: 20 },
      ]},
      { name: "Hip thrust", muscle_groups: ["fessiers"], sets: [
        { reps: 10, weight_kg: 80 }, { reps: 10, weight_kg: 80 }, { reps: 8, weight_kg: 90 },
      ]},
      { name: "Leg curl", muscle_groups: ["ischios"], sets: [
        { reps: 12, weight_kg: 40 }, { reps: 12, weight_kg: 40 }, { reps: 10, weight_kg: 45 },
      ]},
    ],
  },
];

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
