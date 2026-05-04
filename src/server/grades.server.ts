import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * CENTURIA Grade System
 *
 * Grades are based on the best ratio (weight / bodyweight) across the 3 lifts.
 * Each lift has its own ratio thresholds. The user's overall grade is the
 * highest grade achieved on ANY of the 3 lifts.
 *
 * Ratio thresholds per exercise (× BW):
 *   Grade          Squat   Bench   Deadlift
 *   ─────────────  ──────  ──────  ────────
 *   Recruit        0       0       0
 *   Soldat         0.8     0.6     1.0
 *   Guerrier       1.2     0.9     1.4
 *   Spartiate      1.6     1.2     1.8
 *   Gladiateur     2.0     1.5     2.2
 *   Centurion      2.3     1.8     2.6
 *   Titan          2.6     2.0     3.0
 *   Légende        3.0     2.3     3.5
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

const THRESHOLDS: Record<string, number[]> = {
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

/**
 * After a PR is verified:
 * 1. Fetch user's bodyweight from profiles
 * 2. Fetch best verified PR per exercise
 * 3. Compute new grade
 * 4. Add 500 XP
 * 5. Update profile
 * Returns { previousGrade, newGrade, xp, leveledUp }
 */
export async function updateProfileAfterPR(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  previousGrade: Grade;
  newGrade: Grade;
  xp: number;
  leveledUp: boolean;
}> {
  // 1. Get profile
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("poids, xp, current_grade")
    .eq("user_id", userId)
    .single();
  if (pErr || !profile) throw new Error("Profile not found");

  const bodyweight = Number(profile.poids) || 80; // fallback 80kg
  const previousGrade = (profile.current_grade || "recruit") as Grade;
  const previousXp = Number(profile.xp) || 0;

  // 2. Get best verified PR per exercise
  const { data: prs, error: prErr } = await supabase
    .from("prs")
    .select("exercise, weight_kg")
    .eq("user_id", userId)
    .eq("status", "verified");
  if (prErr) throw new Error(`Failed to load PRs: ${prErr.message}`);

  const bestLifts = { squat: 0, bench: 0, deadlift: 0 };
  for (const pr of prs || []) {
    const w = Number(pr.weight_kg);
    const ex = pr.exercise as keyof typeof bestLifts;
    if (ex in bestLifts && w > bestLifts[ex]) {
      bestLifts[ex] = w;
    }
  }

  // 3. Compute new grade
  const newGrade = computeGrade(bodyweight, bestLifts);
  const newXp = previousXp + 500;
  const leveledUp =
    GRADES.indexOf(newGrade) > GRADES.indexOf(previousGrade);

  // 4. Update profile
  const { error: uErr } = await supabase
    .from("profiles")
    .update({
      xp: newXp,
      current_grade: newGrade,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (uErr) throw new Error(`Failed to update profile: ${uErr.message}`);

  return { previousGrade, newGrade, xp: newXp, leveledUp };
}
