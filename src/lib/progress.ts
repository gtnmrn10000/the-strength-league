// Progression réelle calculée à partir des séances réellement terminées.
// Aucune donnée inventée : si rien n'existe, les structures sont vides.
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "./exerciseCatalog";

export type PerfPoint = {
  date: string;
  topWeight: number;
  topReps: number;
  sets: number;
  volume: number;
};

export type ExerciseStats = {
  name: string;
  sessions: number;
  last: PerfPoint | null;
  bestWeight: { weight_kg: number; reps: number; date: string } | null;
  bestSetVolume: { volume: number; weight_kg: number; reps: number; date: string } | null;
  /** Estimation Epley — jamais présentée comme un record réel. */
  estimated1RM: number | null;
  history: PerfPoint[];
};

export type WeekStats = {
  sessions: number;
  sets: number;
  volume: number;
  muscles: string[];
};

export type RecordItem = {
  name: string;
  weight_kg: number;
  reps: number;
  date: string;
};

export type ProgressData = {
  byExercise: Record<string, ExerciseStats>;
  week: WeekStats;
  prevWeek: WeekStats;
  hasPrevWeekData: boolean;
  recentRecords: RecordItem[];
  totalSessions: number;
};

type StoredSet = { reps?: number; weight_kg?: number };
type StoredExercise = { name?: string; sets?: StoredSet[]; muscle_groups?: string[] };

export const EMPTY_PROGRESS: ProgressData = {
  byExercise: {},
  week: { sessions: 0, sets: 0, volume: 0, muscles: [] },
  prevWeek: { sessions: 0, sets: 0, volume: 0, muscles: [] },
  hasPrevWeekData: false,
  recentRecords: [],
  totalSessions: 0,
};

/** Lundi 00:00 de la semaine contenant `d`. */
export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Charge un historique borné (dernières séances terminées) et agrège tout
 * côté client en une passe — rapide même avec beaucoup de séances.
 */
export async function fetchProgress(limit = 120): Promise<ProgressData> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("exercises, muscle_groups, completed_at")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error || !data || data.length === 0) return EMPTY_PROGRESS;

  const now = new Date();
  const weekStart = startOfWeek(now).getTime();
  const prevWeekStart = weekStart - 7 * 24 * 3600 * 1000;

  const byExercise: Record<string, ExerciseStats> = {};
  const week: WeekStats = { sessions: 0, sets: 0, volume: 0, muscles: [] };
  const prev: WeekStats = { sessions: 0, sets: 0, volume: 0, muscles: [] };
  const weekMuscles = new Set<string>();
  const prevMuscles = new Set<string>();

  for (const row of data) {
    const date = String(row.completed_at);
    const ts = new Date(date).getTime();
    const inWeek = ts >= weekStart;
    const inPrev = ts >= prevWeekStart && ts < weekStart;
    if (inWeek) week.sessions += 1;
    if (inPrev) prev.sessions += 1;
    for (const m of row.muscle_groups ?? []) {
      if (inWeek) weekMuscles.add(m);
      if (inPrev) prevMuscles.add(m);
    }

    const list = Array.isArray(row.exercises) ? (row.exercises as StoredExercise[]) : [];
    for (const ex of list) {
      const name = String(ex?.name ?? "").trim();
      const key = normalizeSearch(name);
      if (!key) continue;
      const sets = (Array.isArray(ex.sets) ? ex.sets : []).filter(
        (s) => (s?.reps ?? 0) > 0,
      );
      if (!sets.length) continue;

      let topWeight = 0;
      let topReps = 0;
      let volume = 0;
      let bestSet = { volume: 0, weight_kg: 0, reps: 0 };
      for (const s of sets) {
        const w = s?.weight_kg ?? 0;
        const r = s?.reps ?? 0;
        const v = w * r;
        volume += v;
        if (w > topWeight || (w === topWeight && r > topReps)) {
          topWeight = w;
          topReps = r;
        }
        if (v > bestSet.volume) bestSet = { volume: v, weight_kg: w, reps: r };
      }

      if (inWeek) {
        week.sets += sets.length;
        week.volume += volume;
      }
      if (inPrev) {
        prev.sets += sets.length;
        prev.volume += volume;
      }

      const point: PerfPoint = { date, topWeight, topReps, sets: sets.length, volume };
      const cur =
        byExercise[key] ??
        (byExercise[key] = {
          name,
          sessions: 0,
          last: null,
          bestWeight: null,
          bestSetVolume: null,
          estimated1RM: null,
          history: [],
        });
      cur.sessions += 1;
      // Les lignes arrivent de la plus récente à la plus ancienne.
      if (!cur.last) cur.last = point;
      if (cur.history.length < 8) cur.history.push(point);
      if (!cur.bestWeight || topWeight > cur.bestWeight.weight_kg) {
        cur.bestWeight = { weight_kg: topWeight, reps: topReps, date };
      }
      if (!cur.bestSetVolume || bestSet.volume > cur.bestSetVolume.volume) {
        cur.bestSetVolume = { ...bestSet, date };
      }
    }
  }

  const recentRecords: RecordItem[] = [];
  const since = Date.now() - 21 * 24 * 3600 * 1000;
  for (const st of Object.values(byExercise)) {
    st.estimated1RM = st.bestWeight ? epley(st.bestWeight.weight_kg, st.bestWeight.reps) : null;
    if (st.bestWeight && st.bestWeight.weight_kg > 0 && new Date(st.bestWeight.date).getTime() >= since) {
      recentRecords.push({
        name: st.name,
        weight_kg: st.bestWeight.weight_kg,
        reps: st.bestWeight.reps,
        date: st.bestWeight.date,
      });
    }
  }
  recentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  week.muscles = [...weekMuscles];
  prev.muscles = [...prevMuscles];

  return {
    byExercise,
    week,
    prevWeek: prev,
    hasPrevWeekData: prev.sessions > 0,
    recentRecords: recentRecords.slice(0, 5),
    totalSessions: data.length,
  };
}

export function statsFor(
  data: ProgressData,
  name: string,
): ExerciseStats | undefined {
  return data.byExercise[normalizeSearch(name)];
}

export function formatVolume(kg: number): string {
  if (kg <= 0) return "—";
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`;
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
