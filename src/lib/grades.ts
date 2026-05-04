/**
 * CENTURIA Grade System — shared pure logic (safe for client + server)
 */

export const GRADES = [
  "recruit",
  "soldat",
  "guerrier",
  "spartiate",
  "gladiateur",
  "centurion",
  "titan",
  "legende",
] as const;

export type Grade = (typeof GRADES)[number];

export const THRESHOLDS: Record<string, number[]> = {
  squat:    [0, 0.8, 1.2, 1.6, 2.0, 2.3, 2.6, 3.0],
  bench:    [0, 0.6, 0.9, 1.2, 1.5, 1.8, 2.0, 2.3],
  deadlift: [0, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.5],
};

export const GRADE_LABELS: Record<Grade, string> = {
  recruit: "Recrue",
  soldat: "Soldat",
  guerrier: "Guerrier",
  spartiate: "Spartiate",
  gladiateur: "Gladiateur",
  centurion: "Centurion",
  titan: "Titan",
  legende: "Légende",
};

export const GRADE_EMOJIS: Record<Grade, string> = {
  recruit: "🔰",
  soldat: "⚔️",
  guerrier: "🗡️",
  spartiate: "🛡️",
  gladiateur: "🏛️",
  centurion: "🦅",
  titan: "⚡",
  legende: "👑",
};

function gradeIndexForLift(exercise: string, ratio: number): number {
  const thresholds = THRESHOLDS[exercise];
  if (!thresholds) return 0;
  let idx = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) {
      idx = i;
      break;
    }
  }
  return idx;
}

export function computeGrade(
  bodyweight: number,
  bestLifts: { squat: number; bench: number; deadlift: number }
): Grade {
  if (bodyweight <= 0) return "recruit";
  const squatIdx = gradeIndexForLift("squat", bestLifts.squat / bodyweight);
  const benchIdx = gradeIndexForLift("bench", bestLifts.bench / bodyweight);
  const dlIdx = gradeIndexForLift("deadlift", bestLifts.deadlift / bodyweight);
  const best = Math.max(squatIdx, benchIdx, dlIdx);
  return GRADES[best];
}

/** Compute grade for a single lift */
export function computeGradeForLift(
  exercise: string,
  weightKg: number,
  bodyweight: number
): Grade {
  if (bodyweight <= 0) return "recruit";
  const idx = gradeIndexForLift(exercise, weightKg / bodyweight);
  return GRADES[idx];
}
