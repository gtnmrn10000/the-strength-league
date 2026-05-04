import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertPR(
  supabase: SupabaseClient,
  userId: string,
  data: {
    exercise: "squat" | "bench" | "deadlift";
    weight_kg: number;
    reps: number;
    video_url: string;
  }
) {
  const { data: pr, error } = await supabase
    .from("prs")
    .insert({
      user_id: userId,
      exercise: data.exercise,
      weight_kg: data.weight_kg,
      reps: data.reps,
      video_url: data.video_url,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert PR: ${error.message}`);
  return pr;
}

export async function verifyPR(supabase: SupabaseClient, prId: string) {
  const { error } = await supabase
    .from("prs")
    .update({ status: "verified" })
    .eq("id", prId);

  if (error) throw new Error(`Failed to verify PR: ${error.message}`);
  return { ok: true };
}
