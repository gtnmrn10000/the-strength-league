// Awards workout-completion / personal-record / weekly-regularity XP.
// Server-authoritative: idempotent via the unique (user_id, kind, day) xp_events table.
import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/authClient.ts";
import { GRADES, gradeForXp, type Grade } from "../_shared/grades.ts";

const schema = z.object({ sessionId: z.string().uuid() });

const XP_SESSION_COMPLETE = 50;
const XP_PERSONAL_RECORD = 30;
const XP_WEEKLY_REGULARITY = 100;
const SESSIONS_PER_WEEK_CAP = 5;
const SESSIONS_FOR_WEEKLY_BONUS = 3;

function isoWeekMonday(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

// deno-lint-ignore no-explicit-any
async function tryRecordXpEvent(supabase: any, userId: string, kind: string, day: string): Promise<boolean> {
  const { error } = await supabase.from("xp_events").insert({ user_id: userId, kind, amount: 0, day });
  if (error) {
    if ((error as { code?: string }).code === "23505") return false;
    throw new Error(`Failed to record xp event: ${error.message}`);
  }
  return true;
}

type LoggedExercise = { name?: string; sets?: Array<{ weight_kg?: number; weight?: number }> };

// deno-lint-ignore no-explicit-any
async function hasNewPersonalRecord(supabase: any, userId: string, exercises: unknown, completedAt: string): Promise<boolean> {
  const current = Array.isArray(exercises) ? (exercises as LoggedExercise[]) : [];
  if (current.length === 0) return false;
  const currentMax = new Map<string, number>();
  for (const ex of current) {
    if (!ex?.name || !Array.isArray(ex.sets)) continue;
    for (const set of ex.sets) {
      const w = Number(set.weight_kg ?? set.weight ?? 0);
      if (w > 0) currentMax.set(ex.name, Math.max(currentMax.get(ex.name) ?? 0, w));
    }
  }
  if (currentMax.size === 0) return false;

  const { data: past, error } = await supabase
    .from("workout_sessions")
    .select("exercises")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .lt("completed_at", completedAt)
    .limit(200);
  if (error) return false;

  const historicalMax = new Map<string, number>();
  for (const row of past ?? []) {
    const rowExercises = Array.isArray(row.exercises) ? (row.exercises as LoggedExercise[]) : [];
    for (const ex of rowExercises) {
      if (!ex?.name || !Array.isArray(ex.sets)) continue;
      for (const set of ex.sets) {
        const w = Number(set.weight_kg ?? set.weight ?? 0);
        if (w > 0) historicalMax.set(ex.name, Math.max(historicalMax.get(ex.name) ?? 0, w));
      }
    }
  }
  for (const [name, weight] of currentMax) {
    const prev = historicalMax.get(name) ?? 0;
    if (weight > prev) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { supabase, userId } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const { sessionId } = schema.parse(body);

    const { data: session, error } = await supabase
      .from("workout_sessions")
      .select("id, user_id, completed_at, exercises")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return errorResponse(error.message, 500);
    if (!session) return errorResponse("Séance introuvable", 404);
    if (!session.completed_at) return errorResponse("La séance n'est pas terminée", 400);

    const day = (session.completed_at as string).slice(0, 10);
    const week = isoWeekMonday(new Date(session.completed_at as string));

    let sessionGained = 0;
    const { count: weekCount } = await supabase
      .from("xp_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "session_complete")
      .gte("day", week);
    if ((weekCount ?? 0) < SESSIONS_PER_WEEK_CAP) {
      const isNew = await tryRecordXpEvent(supabase, userId, "session_complete", day);
      if (isNew) sessionGained += XP_SESSION_COMPLETE;
    }

    const { count: distinctDaysCount } = await supabase
      .from("xp_events")
      .select("day", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "session_complete")
      .gte("day", week);
    if ((distinctDaysCount ?? 0) >= SESSIONS_FOR_WEEKLY_BONUS) {
      const isNewBonus = await tryRecordXpEvent(supabase, userId, "weekly_regularity", week);
      if (isNewBonus) sessionGained += XP_WEEKLY_REGULARITY;
    }

    let prGained = 0;
    const isNewPr = await hasNewPersonalRecord(supabase, userId, session.exercises, session.completed_at as string);
    if (isNewPr) {
      const isNew = await tryRecordXpEvent(supabase, userId, "personal_record", day);
      if (isNew) prGained = XP_PERSONAL_RECORD;
    }

    const totalGained = sessionGained + prGained;

    const { data: profile } = await supabase.rpc("get_my_profile").maybeSingle();
    if (!profile) {
      await supabase.from("profiles").upsert(
        { user_id: userId, pseudo: `athlete_${userId.slice(0, 6)}`, onboarded: true, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    }
    const p = (profile ?? {}) as { xp: number | null; current_grade: string | null };
    const previousXp = Number(p.xp) || 0;
    const previousGrade = (p.current_grade || "recruit") as Grade;
    const newXp = Math.max(0, previousXp + totalGained);
    const newGrade = gradeForXp(newXp);
    const leveledUp = GRADES.indexOf(newGrade) > GRADES.indexOf(previousGrade);

    const { error: uErr } = await supabase
      .from("profiles")
      .update({ xp: newXp, current_grade: newGrade, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (uErr) return errorResponse(`Failed to update profile: ${uErr.message}`, 500);

    return jsonResponse({
      xp: newXp,
      grade: newGrade,
      previousGrade,
      leveledUp,
      gained: totalGained,
    });
  } catch (e) {
    if (e instanceof Response) {
      const text = await e.text().catch(() => "Error");
      return errorResponse(text, e.status);
    }
    console.error("[award-xp] error", e);
    return errorResponse(e instanceof Error ? e.message : "Erreur interne", 500);
  }
});
