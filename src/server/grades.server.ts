import type { SupabaseClient } from "@supabase/supabase-js";
import { GRADES, computeGrade, type Grade } from "@/lib/grades";

// Re-export for convenience
export { GRADES, GRADE_LABELS, GRADE_EMOJIS, computeGrade, computeGradeForLift, type Grade } from "@/lib/grades";

/**
 * After a PR is verified:
 * 1. Fetch user's bodyweight from profiles
 * 2. Fetch best verified PR per exercise
 * 3. Compute new grade
 * 4. Add 500 XP + update last_pr_at
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

  const bodyweight = Number(profile.poids) || 80;
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
      last_pr_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (uErr) throw new Error(`Failed to update profile: ${uErr.message}`);

  return { previousGrade, newGrade, xp: newXp, leveledUp };
}
