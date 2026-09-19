// Données utilisateur liées à la bibliothèque : favoris, exercices persos,
// récents (local) et dernières performances par exercice.
import { supabase } from "@/integrations/supabase/client";
import {
  EXERCISE_LIBRARY,
  normalizeSearch,
  type Equipment,
  type LibraryExercise,
  type MuscleCategory,
} from "./exerciseCatalog";

const RECENTS_KEY = "centuria_recent_exercises";
const RECENTS_MAX = 8;

export function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentId(id: string) {
  try {
    const next = [id, ...getRecentIds().filter((x) => x !== id)].slice(0, RECENTS_MAX);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
}

/* ---------------- Favoris (Supabase, owner-only) ---------------- */

export async function fetchFavorites(): Promise<string[]> {
  const { data, error } = await supabase.from("exercise_favorites").select("exercise_id");
  if (error || !data) return [];
  return data.map((r) => r.exercise_id);
}

export async function toggleFavorite(exerciseId: string, isFav: boolean): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return false;
  if (isFav) {
    const { error } = await supabase
      .from("exercise_favorites")
      .delete()
      .eq("user_id", uid)
      .eq("exercise_id", exerciseId);
    return !error;
  }
  const { error } = await supabase
    .from("exercise_favorites")
    .insert([{ user_id: uid, exercise_id: exerciseId }]);
  return !error;
}

/* ---------------- Exercices personnalisés ---------------- */

const CATEGORY_OF_MUSCLE: Record<string, MuscleCategory> = {
  pectoraux: "pectoraux",
  dos: "dos",
  epaules: "epaules",
  biceps: "bras",
  triceps: "bras",
  avant_bras: "bras",
  quadriceps: "jambes",
  ischios: "jambes",
  fessiers: "jambes",
  mollets: "jambes",
  abdos: "abdos",
};

export function customRowToExercise(row: {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
}): LibraryExercise {
  const primary = row.primary_muscle;
  return {
    id: `custom:${row.id}`,
    name: row.name,
    aliases: [],
    primary,
    muscles: [primary],
    category: CATEGORY_OF_MUSCLE[primary] ?? "abdos",
    equipment: (row.equipment as Equipment) ?? "halteres",
    difficulty: "intermediaire",
    custom: true,
  };
}

export async function fetchCustomExercises(): Promise<LibraryExercise[]> {
  const { data, error } = await supabase
    .from("custom_exercises")
    .select("id, name, primary_muscle, equipment")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(customRowToExercise);
}

export async function createCustomExercise(input: {
  name: string;
  primary_muscle: string;
  equipment: Equipment;
}): Promise<LibraryExercise | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("custom_exercises")
    .insert([{ ...input, user_id: uid }])
    .select("id, name, primary_muscle, equipment")
    .single();
  if (error || !data) return null;
  return customRowToExercise(data);
}

export async function deleteCustomExercise(id: string): Promise<boolean> {
  const realId = id.startsWith("custom:") ? id.slice(7) : id;
  const { error } = await supabase.from("custom_exercises").delete().eq("id", realId);
  return !error;
}

/* ---------------- Dernières performances ---------------- */

export type LastPerf = { weight_kg: number; reps: number; date: string };

type StoredSet = { reps?: number; weight_kg?: number };
type StoredExercise = { name?: string; sets?: StoredSet[] };

/**
 * Dernière performance connue par exercice (clé = nom normalisé),
 * basée sur les séances réellement terminées de l'utilisateur.
 */
export async function fetchLastPerformances(): Promise<Record<string, LastPerf>> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("exercises, completed_at")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(40);
  if (error || !data) return {};

  const out: Record<string, LastPerf> = {};
  for (const row of data) {
    const list = Array.isArray(row.exercises) ? (row.exercises as StoredExercise[]) : [];
    for (const ex of list) {
      const key = normalizeSearch(String(ex?.name ?? ""));
      if (!key || out[key]) continue; // la plus récente gagne
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      if (!sets.length) continue;
      const best = sets.reduce<{ weight_kg: number; reps: number }>(
        (acc, s) => ((s?.weight_kg ?? 0) >= acc.weight_kg ? { weight_kg: s?.weight_kg ?? 0, reps: s?.reps ?? 0 } : acc),
        { weight_kg: 0, reps: 0 },
      );
      out[key] = { ...best, date: String(row.completed_at) };
    }
  }
  return out;
}

export function lastPerfFor(
  perfs: Record<string, LastPerf>,
  name: string,
): LastPerf | undefined {
  return perfs[normalizeSearch(name)];
}

/** Bibliothèque complète = catalogue + exercices persos de l'utilisateur. */
export function mergeLibrary(custom: LibraryExercise[]): LibraryExercise[] {
  return [...custom, ...EXERCISE_LIBRARY];
}
