import type { SupabaseClient } from "@supabase/supabase-js";
import { GRADES, GRADE_XP, gradeForXp, type Grade } from "@/lib/grades";

// Re-export for convenience
export {
  GRADES,
  GRADE_XP,
  GRADE_LABELS,
  GRADE_EMOJIS,
  gradeForXp,
  nextGradeInfo,
  computeGrade,
  computeGradeForLift,
  type Grade,
} from "@/lib/grades";

/*
 * ─────────────────────────────────────────────────────────────────────
 * XP réel — garde-fous anti-spam
 * ─────────────────────────────────────────────────────────────────────
 * Toute attribution d'XP passe par la table additive `xp_events`
 * (unique(user_id, kind, day)) : une ligne = un événement déjà récompensé.
 * On tente un INSERT ; s'il est rejeté par la contrainte unique, l'action
 * a déjà été récompensée ce jour-là et on ne redonne rien (idempotence).
 */

const XP_SESSION_COMPLETE = 50;
const XP_PERSONAL_RECORD = 30;
const XP_COMMUNITY_PR = 300;
const XP_WEEKLY_REGULARITY = 100;
const SESSIONS_PER_WEEK_CAP = 5;
const SESSIONS_FOR_WEEKLY_BONUS = 3;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Lundi (ISO) de la semaine contenant `date`, au format YYYY-MM-DD. */
function isoWeekMonday(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // 1 (lundi) .. 7 (dimanche)
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Tente d'enregistrer un événement XP unique (user_id, kind, day).
 * Retourne true si l'événement est nouveau (XP à créditer), false s'il
 * existait déjà (idempotence — aucun XP supplémentaire).
 */
async function tryRecordXpEvent(
  supabase: SupabaseClient,
  userId: string,
  kind: string,
  amount: number,
  day: string
): Promise<boolean> {
  const { error } = await supabase
    .from("xp_events")
    .insert({ user_id: userId, kind, amount, day });
  if (error) {
    // 23505 = unique_violation → déjà attribué, ce n'est pas une erreur
    if ((error as { code?: string }).code === "23505") return false;
    throw new Error(`Failed to record xp event: ${error.message}`);
  }
  return true;
}

/** Applique un delta d'XP au profil et recalcule son grade. */
async function applyXpDelta(
  supabase: SupabaseClient,
  userId: string,
  delta: number
): Promise<{ previousGrade: Grade; newGrade: Grade; xp: number; leveledUp: boolean }> {
  const { data: profile } = await supabase.rpc("get_my_profile").maybeSingle();
  if (!profile) {
    await supabase.from("profiles").upsert(
      { user_id: userId, pseudo: `athlete_${userId.slice(0, 6)}`, onboarded: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }
  const p = (profile ?? {}) as { xp: number | null; current_grade: string | null };
  const previousXp = Number(p.xp) || 0;
  const previousGrade = (p.current_grade || "recruit") as Grade;

  const newXp = Math.max(0, previousXp + delta);
  const newGrade = gradeForXp(newXp);
  const leveledUp = GRADES.indexOf(newGrade) > GRADES.indexOf(previousGrade);

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

/**
 * Après une séance réellement terminée (`completed_at` renseigné) :
 * +50 XP, plafonné à 1/jour et ~5/semaine. Ajoute un bonus de régularité
 * (+100 XP, une seule fois/semaine) dès la 3e séance distincte de la
 * semaine en cours.
 */
export async function awardSessionCompletionXp(
  supabase: SupabaseClient,
  userId: string,
  completedAt: string
): Promise<{ gained: number; kinds: string[] }> {
  const day = completedAt.slice(0, 10);
  const week = isoWeekMonday(new Date(completedAt));
  let gained = 0;
  const kinds: string[] = [];

  // Plafond hebdo : compte les séances déjà créditées cette semaine.
  const { count: weekCount } = await supabase
    .from("xp_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "session_complete")
    .gte("day", week);

  if ((weekCount ?? 0) < SESSIONS_PER_WEEK_CAP) {
    const isNew = await tryRecordXpEvent(supabase, userId, "session_complete", XP_SESSION_COMPLETE, day);
    if (isNew) {
      gained += XP_SESSION_COMPLETE;
      kinds.push("session_complete");
    }
  }

  // Bonus régularité : dès la Nème séance distincte de la semaine.
  const { count: distinctDaysCount } = await supabase
    .from("xp_events")
    .select("day", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "session_complete")
    .gte("day", week);

  if ((distinctDaysCount ?? 0) >= SESSIONS_FOR_WEEKLY_BONUS) {
    const isNewBonus = await tryRecordXpEvent(
      supabase,
      userId,
      "weekly_regularity",
      XP_WEEKLY_REGULARITY,
      week
    );
    if (isNewBonus) {
      gained += XP_WEEKLY_REGULARITY;
      kinds.push("weekly_regularity");
    }
  }

  return { gained, kinds };
}

/**
 * Nouveau record personnel réel détecté sur une séance (poids soulevé
 * supérieur à tout ce qui a été loggé avant pour ce mouvement) : +30 XP,
 * plafonné à 1/jour (peu importe le nombre de PR détectés le même jour).
 */
export async function awardPersonalRecordXp(
  supabase: SupabaseClient,
  userId: string,
  day: string
): Promise<{ gained: number }> {
  const isNew = await tryRecordXpEvent(supabase, userId, "personal_record", XP_PERSONAL_RECORD, day);
  return { gained: isNew ? XP_PERSONAL_RECORD : 0 };
}

/**
 * PR communautaire vérifié (voté valide par la communauté) : +300 XP.
 * Idempotent par PR (kind namespacé avec l'id du PR) — un même PR ne
 * peut être crédité qu'une seule fois, même si la vérification est
 * redéclenchée.
 */
export async function awardCommunityPrXp(
  supabase: SupabaseClient,
  userId: string,
  prId: string
): Promise<{ gained: number }> {
  const isNew = await tryRecordXpEvent(
    supabase,
    userId,
    `community_pr:${prId}`,
    XP_COMMUNITY_PR,
    todayIso()
  );
  return { gained: isNew ? XP_COMMUNITY_PR : 0 };
}

/**
 * Appelée quand un PR passe en "verified" (vote communautaire). Remplace
 * l'ancien +500 XP forfaitaire par le barème XP réel (+300, idempotent
 * par PR) et recalcule le grade à partir de l'XP total.
 */
export async function updateProfileAfterPR(
  supabase: SupabaseClient,
  userId: string,
  prId: string
): Promise<{ previousGrade: Grade; newGrade: Grade; xp: number; leveledUp: boolean }> {
  const { gained } = await awardCommunityPrXp(supabase, userId, prId);
  const result = await applyXpDelta(supabase, userId, gained);
  if (gained > 0) {
    await supabase
      .from("profiles")
      .update({ last_pr_at: new Date().toISOString() })
      .eq("user_id", userId);
  }
  return result;
}

/**
 * À appeler à la fin d'une séance réellement terminée. Combine XP de
 * séance + bonus régularité + détection de record personnel, applique le
 * delta au profil et retourne le résultat consolidé (utilisé par la
 * server function `awardWorkoutXp`).
 */
export async function awardWorkoutXpServer(
  supabase: SupabaseClient,
  userId: string,
  session: { completed_at: string; exercises: unknown }
): Promise<{ xp: number; grade: Grade; leveledUp: boolean; previousGrade: Grade; gained: number }> {
  const day = session.completed_at.slice(0, 10);

  const { gained: sessionGained } = await awardSessionCompletionXp(supabase, userId, session.completed_at);

  let prGained = 0;
  const isNewPr = await hasNewPersonalRecord(supabase, userId, session.exercises, session.completed_at);
  if (isNewPr) {
    const { gained } = await awardPersonalRecordXp(supabase, userId, day);
    prGained = gained;
  }

  const totalGained = sessionGained + prGained;
  const result = await applyXpDelta(supabase, userId, totalGained);

  return {
    xp: result.xp,
    grade: result.newGrade,
    previousGrade: result.previousGrade,
    leveledUp: result.leveledUp,
    gained: totalGained,
  };
}

type LoggedExercise = { name?: string; sets?: Array<{ weight_kg?: number; weight?: number }> };

/**
 * Compare les charges de la séance qui vient de se terminer aux séances
 * précédemment terminées par le même utilisateur pour détecter un
 * dépassement réel (nouveau max de charge sur un mouvement loggé).
 */
async function hasNewPersonalRecord(
  supabase: SupabaseClient,
  userId: string,
  exercises: unknown,
  completedAt: string
): Promise<boolean> {
  const current = Array.isArray(exercises) ? (exercises as LoggedExercise[]) : [];
  if (current.length === 0) return false;

  const currentMax = new Map<string, number>();
  for (const ex of current) {
    if (!ex?.name || !Array.isArray(ex.sets)) continue;
    for (const set of ex.sets) {
      const w = Number(set.weight_kg ?? set.weight ?? 0);
      if (w > 0) {
        currentMax.set(ex.name, Math.max(currentMax.get(ex.name) ?? 0, w));
      }
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
        if (w > 0) {
          historicalMax.set(ex.name, Math.max(historicalMax.get(ex.name) ?? 0, w));
        }
      }
    }
  }

  for (const [name, weight] of currentMax) {
    const prev = historicalMax.get(name) ?? 0;
    if (weight > prev) return true;
  }
  return false;
}
