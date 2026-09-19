// Awards workout-completion / personal-record / weekly-regularity XP.
// Server-authoritative: idempotent per stable server reference in xp_events.ref_id.
import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser, adminClient } from "../_shared/authClient.ts";
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

async function stableUuid(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes.slice(0, 16)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// deno-lint-ignore no-explicit-any
async function recordXpEvent(supabase: any, userId: string, kind: string, amount: number, day: string, refId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("record_xp_event", {
    _user_id: userId,
    _kind: kind,
    _amount: amount,
    _day: day,
    _ref_id: refId,
  });
  if (error) throw new Error(`Failed to record xp event: ${error.message}`);
  return data === true;
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
    // Écritures XP réservées au service role : les clients ne peuvent plus
    // écrire xp_events ni profiles.xp (migration 0013).
    const admin = adminClient();
    const body = await req.json().catch(() => ({}));
    const { sessionId } = schema.parse(body);

    const { data: session, error } = await supabase
      .from("workout_sessions")
      .select("id, user_id, completed_at, duration_min, exercises")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return errorResponse(error.message, 500);
    if (!session) return errorResponse("Séance introuvable", 404);
    if (!session.completed_at) return errorResponse("La séance n'est pas terminée", 400);

    // Anti-farming : aucune série réellement validée ou durée absurde => aucun XP.
    const sessionExercises = Array.isArray(session.exercises) ? (session.exercises as LoggedExercise[]) : [];
    const completedSets = sessionExercises.reduce((n: number, ex: LoggedExercise) => {
      if (!Array.isArray(ex?.sets)) return n;
      return n + ex.sets.filter((set) => {
        const s = set as { done?: boolean; completed?: boolean; reps?: number };
        const done = s.done ?? s.completed ?? true;
        return done && Number(s.reps ?? 0) > 0;
      }).length;
    }, 0);
    const durationMin = Number((session as { duration_min?: number | null }).duration_min ?? 0);
    if (completedSets < 1 || durationMin > 360) {
      return jsonResponse({
        xp: 0, grade: "recruit", previousGrade: "recruit",
        leveledUp: false, gained: 0, skipped: true,
      });
    }

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
      const isNew = await recordXpEvent(admin, userId, "session_complete", XP_SESSION_COMPLETE, day, session.id);
      if (isNew) sessionGained += XP_SESSION_COMPLETE;
    }

    const { count: distinctDaysCount } = await supabase
      .from("xp_events")
      .select("day", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "session_complete")
      .gte("day", week);
    if ((distinctDaysCount ?? 0) >= SESSIONS_FOR_WEEKLY_BONUS) {
      const weeklyRef = await stableUuid(`weekly_regularity:${userId}:${week}`);
      const isNewBonus = await recordXpEvent(admin, userId, "weekly_regularity", XP_WEEKLY_REGULARITY, week, weeklyRef);
      if (isNewBonus) sessionGained += XP_WEEKLY_REGULARITY;
    }

    let prGained = 0;
    const isNewPr = await hasNewPersonalRecord(supabase, userId, session.exercises, session.completed_at as string);
    if (isNewPr) {
      const isNew = await recordXpEvent(admin, userId, "personal_record", XP_PERSONAL_RECORD, day, session.id);
      if (isNew) prGained = XP_PERSONAL_RECORD;
    }

    const totalGained = sessionGained + prGained;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("xp, current_grade")
      .eq("user_id", userId)
      .single();
    if (profileError || !profile) return errorResponse("Profil introuvable", 404);
    const newXp = Number(profile.xp) || 0;
    const newGrade = gradeForXp(newXp);
    const previousXp = Math.max(0, newXp - totalGained);
    const previousGrade = gradeForXp(previousXp) as Grade;
    const leveledUp = GRADES.indexOf(newGrade) > GRADES.indexOf(previousGrade);

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
