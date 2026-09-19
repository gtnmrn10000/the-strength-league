import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ---------- Shared error handling ----------
/**
 * supabase.functions.invoke() throws a FunctionsHttpError whose `context`
 * is the raw Response from the edge function when it returns a non-2xx
 * status. Our edge functions always reply with `{ error: string }` JSON
 * bodies (see supabase/functions/_shared/cors.ts -> errorResponse). We
 * rebuild an Error whose message contains BOTH the numeric status and the
 * original text so the existing UI checks (e.g. `msg.includes("402")`,
 * `msg.includes("PREMIUM_REQUIRED")`, `msg.includes("401")`) keep working
 * unchanged.
 */
async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const res = error.context as Response;
      let text = "";
      try {
        const json = await res.clone().json();
        text = typeof json?.error === "string" ? json.error : JSON.stringify(json);
      } catch {
        text = await res.text().catch(() => error.message);
      }
      throw new Error(`${res.status}: ${text}`);
    }
    throw new Error(error.message ?? "Erreur réseau");
  }
  return data as T;
}

// ================= Coach =================

export type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_s: number;
  muscle_groups: string[];
  suggested_weight_kg?: number;
  notes?: string;
};

export type GeneratedWorkout = {
  name: string;
  duration_min: number;
  focus: string;
  muscle_groups: string[];
  warmup: string;
  exercises: GeneratedExercise[];
  cooldown: string;
  /** Date ISO YYYY-MM-DD suggérée par l'IA (peut être null si "maintenant"). */
  scheduled_for?: string | null;
};

export type GeneratedRecipe = {
  name: string;
  prep_min: number;
  kcal: number;
  prot_g: number;
  carbs_g: number;
  fats_g: number;
  ingredients: Array<{ name: string; qty: string }>;
  steps: string[];
};

export type AssistantContent = {
  reply: string;
  workout?: GeneratedWorkout | null;
  recipe?: GeneratedRecipe | null;
  warnings?: string[];
};

export type ChatMsg =
  | { role: "user"; content: string; at?: string }
  | {
      role: "assistant";
      content: string;
      workout?: GeneratedWorkout | null;
      recipe?: GeneratedRecipe | null;
      warnings?: string[];
      at?: string;
    };

export type WeeklyStats = {
  sessions: { count: number; total_min: number; by_group: Record<string, number> };
  nutrition: {
    days: number;
    avg_kcal: number;
    avg_prot: number;
    avg_carbs: number;
    avg_fats: number;
    goals: { kcal: number; prot: number; carbs: number; fats: number } | null;
  };
  prs: { verified_count: number; last_pr_at: string | null };
};

export type PlannedWorkout = {
  id: string;
  name: string;
  muscle_groups: string[];
  duration_min: number | null;
  exercises: any;
  scheduled_for: string;
};

export function coachChat(message: string): Promise<AssistantContent> {
  return callFunction("coach", { action: "chat", message });
}

export function coachHistory(): Promise<ChatMsg[]> {
  return callFunction("coach", { action: "history" });
}

export function coachClearHistory(): Promise<{ ok: true }> {
  return callFunction("coach", { action: "clearHistory" });
}

export function coachRecovery(): Promise<Array<{ muscle_groups: string[]; completed_at: string; name: string }>> {
  return callFunction("coach", { action: "recovery" });
}

export function coachWeeklyStats(): Promise<WeeklyStats> {
  return callFunction("coach", { action: "weeklyStats" });
}

export function coachSaveWorkoutSession(input: {
  name: string;
  duration_min?: number;
  muscle_groups: string[];
  exercises: unknown[];
  notes?: string;
  mode?: "start" | "schedule";
  scheduled_for?: string | null;
}): Promise<{ id: string; completed_at: string | null; scheduled_for: string | null }> {
  return callFunction("coach", { action: "saveWorkoutSession", ...input });
}

// ================= Food photo =================

export type FoodPhotoResult = {
  name: string;
  brand: string | null;
  estimated_grams: number;
  nutriments_100g: {
    energy_kcal_100g: number;
    proteins_100g: number;
    carbs_100g: number;
    fat_100g: number;
  };
  confidence: "low" | "medium" | "high";
  notes?: string;
};

export function recognizeFoodPhoto(imageDataUrl: string): Promise<FoodPhotoResult> {
  return callFunction("food-photo", { image_data_url: imageDataUrl });
}

// ================= Account =================

/** Phrase exacte attendue en 2e confirmation avant suppression définitive. */
export const DELETE_CONFIRM_PHRASE = "SUPPRIMER";

export function exportMyData(): Promise<Record<string, unknown>> {
  return callFunction("account", { action: "export" });
}

export function deleteMyAccount(confirm: string): Promise<{ ok: true }> {
  return callFunction("account", { action: "delete", confirm });
}

// ================= XP =================

export type Grade = string;

export type AwardWorkoutXpResult = {
  xp: number;
  grade: Grade;
  leveledUp: boolean;
  previousGrade: Grade;
  gained: number;
};

export function awardWorkoutXp(sessionId: string): Promise<AwardWorkoutXpResult> {
  return callFunction("award-xp", { sessionId });
}

// ================= PRs =================

// Community verification thresholds
export const VERIFY_NET_VOTES = 5; // (valid - doubt) >= this → verified
export const CONTEST_MIN_TOTAL = 5; // at least this many votes...
export const CONTEST_DOUBT_RATIO = 0.5; // ...and >50% doubt → contested

export type PRVoteResult = {
  status: "pending" | "verified" | "contested" | "rejected" | "suspect";
  valid_count: number;
  doubt_count: number;
  my_vote: "valid" | "doubt" | null;
  transitioned_to_verified: boolean;
};

export function submitPR(input: {
  exercise: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  video_url: string;
}): Promise<{ id: string }> {
  return callFunction("prs", { action: "submit", ...input });
}

export function voteOnPR(input: { prId: string; vote: "valid" | "doubt" }): Promise<PRVoteResult> {
  return callFunction("prs", { action: "vote", ...input });
}
