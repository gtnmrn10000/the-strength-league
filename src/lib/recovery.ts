// Courbes de récupération musculaire — heures nécessaires pour être frais à 100%
// Basé sur les recos EBM (48-72h grands groupes, 24h petits groupes).

export type MuscleGroup =
  | "pectoraux"
  | "dos"
  | "jambes"
  | "epaules"
  | "biceps"
  | "triceps"
  | "abdos"
  | "fessiers"
  | "mollets"
  | "avant_bras";

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pectoraux: "Pectoraux",
  dos: "Dos",
  jambes: "Jambes",
  epaules: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  abdos: "Abdos",
  fessiers: "Fessiers",
  mollets: "Mollets",
  avant_bras: "Avant-bras",
};

export const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  pectoraux: 48,
  dos: 48,
  jambes: 72,
  epaules: 48,
  biceps: 24,
  triceps: 24,
  abdos: 24,
  fessiers: 48,
  mollets: 24,
  avant_bras: 24,
};

export const ALL_GROUPS: MuscleGroup[] = Object.keys(RECOVERY_HOURS) as MuscleGroup[];

export type RecoveryState = {
  group: MuscleGroup;
  label: string;
  percent: number; // 0 = épuisé, 100 = frais
  hoursSince: number | null;
  hoursTotal: number;
  status: "fresh" | "recovering" | "fatigued";
  lastAt: string | null;
};

/**
 * Calcule le % de récup d'un groupe donné à partir de la date du dernier travail.
 * Modèle linéaire : 0% juste après la séance, 100% après `RECOVERY_HOURS[group]`.
 */
export function recoveryFor(group: MuscleGroup, lastWorkedAt: string | null, now = new Date()): RecoveryState {
  const total = RECOVERY_HOURS[group];
  if (!lastWorkedAt) {
    return { group, label: MUSCLE_LABEL[group], percent: 100, hoursSince: null, hoursTotal: total, status: "fresh", lastAt: null };
  }
  const last = new Date(lastWorkedAt).getTime();
  const diffH = Math.max(0, (now.getTime() - last) / 36e5);
  const percent = Math.min(100, Math.round((diffH / total) * 100));
  const status: RecoveryState["status"] = percent >= 90 ? "fresh" : percent >= 50 ? "recovering" : "fatigued";
  return { group, label: MUSCLE_LABEL[group], percent, hoursSince: Math.round(diffH), hoursTotal: total, status, lastAt: lastWorkedAt };
}

/**
 * À partir d'une liste de séances (chacune avec `muscle_groups` + `completed_at`),
 * retourne la récup courante par groupe (dernier hit conservé).
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
