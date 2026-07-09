// Courbes de récupération musculaire — heures pour retour à 100%.
// Basé sur les recos EBM : grands groupes 48-72h, petits 24-36h.

export type MuscleGroup =
  | "quadriceps"
  | "ischios"
  | "fessiers"
  | "dos"
  | "pectoraux"
  | "epaules"
  | "biceps"
  | "triceps"
  | "avant_bras"
  | "abdos"
  | "mollets";

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  quadriceps: "Quadriceps",
  ischios: "Ischios",
  fessiers: "Fessiers",
  dos: "Dos",
  pectoraux: "Pectoraux",
  epaules: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  avant_bras: "Avant-bras",
  abdos: "Abdos",
  mollets: "Mollets",
};

export const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  quadriceps: 72,
  ischios: 72,
  fessiers: 72,
  dos: 48,
  pectoraux: 48,
  epaules: 48,
  biceps: 30,
  triceps: 30,
  avant_bras: 24,
  abdos: 24,
  mollets: 24,
};

export const ALL_GROUPS: MuscleGroup[] = Object.keys(RECOVERY_HOURS) as MuscleGroup[];

export type RecoveryStatus = "fresh" | "recovering" | "fatigued";

export type RecoveryState = {
  group: MuscleGroup;
  label: string;
  percent: number; // 0 = tout juste sollicité, 100 = frais
  hoursSince: number | null;
  hoursTotal: number;
  status: RecoveryStatus;
  lastAt: string | null;
};

// Seuils demandés : rouge <50, orange 50-80, vert >80
export function statusFromPercent(p: number): RecoveryStatus {
  if (p > 80) return "fresh";
  if (p >= 50) return "recovering";
  return "fatigued";
}

/**
 * % de récup = min(100, (heures_écoulées / recovery_hours) × 100).
 */
export function recoveryFor(group: MuscleGroup, lastWorkedAt: string | null, now = new Date()): RecoveryState {
  const total = RECOVERY_HOURS[group];
  if (!lastWorkedAt) {
    return {
      group,
      label: MUSCLE_LABEL[group],
      percent: 100,
      hoursSince: null,
      hoursTotal: total,
      status: "fresh",
      lastAt: null,
    };
  }
  const last = new Date(lastWorkedAt).getTime();
  const diffH = Math.max(0, (now.getTime() - last) / 36e5);
  const percent = Math.min(100, Math.round((diffH / total) * 100));
  return {
    group,
    label: MUSCLE_LABEL[group],
    percent,
    hoursSince: Math.round(diffH),
    hoursTotal: total,
    status: statusFromPercent(percent),
    lastAt: lastWorkedAt,
  };
}

/**
 * À partir d'une liste de séances (muscle_groups + performed_at/completed_at),
 * calcule la récup courante par groupe.
 */
export function computeRecovery(
  sessions: Array<{ muscle_groups: string[] | null; completed_at: string }>,
): RecoveryState[] {
  const last: Partial<Record<MuscleGroup, string>> = {};
  for (const s of sessions) {
    const t = s.completed_at;
    for (const g of s.muscle_groups ?? []) {
      const mg = g as MuscleGroup;
      if (!RECOVERY_HOURS[mg]) continue;
      if (!last[mg] || new Date(t) > new Date(last[mg]!)) last[mg] = t;
    }
  }
  return ALL_GROUPS.map((g) => recoveryFor(g, last[g] ?? null));
}
