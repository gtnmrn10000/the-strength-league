/**
 * Séance en cours sauvegardée localement (survit à un plantage, à une mise en
 * arrière-plan ou à un redémarrage de l'app). Source de vérité unique de la clé
 * de brouillon, partagée par le logger et les écrans qui proposent la reprise.
 */
export const ACTIVE_SESSION_KEY = "centuria:active-session";

export type ActiveSessionInfo = {
  id: string;
  name: string;
  startedAt: number;
  doneSets: number;
  totalSets: number;
};

export function readActiveSession(): ActiveSessionInfo | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as {
      id?: string;
      startedAt?: number;
      done?: Record<string, boolean>;
      template?: { name?: string; exercises?: { sets?: unknown[] }[] };
    };
    const exercises = d?.template?.exercises;
    if (!Array.isArray(exercises) || exercises.length === 0) return null;
    return {
      id: d.id ?? "",
      name: d.template?.name ?? "Séance en cours",
      startedAt: d.startedAt ?? Date.now(),
      doneSets: Object.values(d.done ?? {}).filter(Boolean).length,
      totalSets: exercises.reduce((n, ex) => n + (ex.sets?.length ?? 0), 0),
    };
  } catch {
    return null;
  }
}
