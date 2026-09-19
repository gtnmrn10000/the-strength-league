import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const QUEUE_KEY = "centuria:pending-sessions";
const BACKOFF_STEPS_MS = [2000, 5000, 15000, 60000]; // plafond 60s
const RETRY_TIMER_MS = 5000;

export type PendingSessionPayload = {
  id: string;
  user_id: string;
  name: string;
  exercises: Json;
  muscle_groups: string[];
  duration_min: number | null;
  completed_at: string;
};

/** Enveloppe interne : ajoute l'état de retry sans changer le contrat public. */
type QueuedItem = PendingSessionPayload & {
  __attempts?: number;
  __nextAt?: number;
};

type Listener = () => void;
const listeners = new Set<Listener>();
let syncing = false;
let retryTimer: ReturnType<typeof setInterval> | null = null;

function notify() {
  for (const l of listeners) l();
}

function readQueue(): QueuedItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* quota — sans gravité */
  }
  ensureRetryTimer(items.length > 0);
  notify();
}

function ensureRetryTimer(shouldRun: boolean) {
  if (typeof window === "undefined") return;
  if (shouldRun && !retryTimer) {
    retryTimer = setInterval(() => {
      void flushPendingSessions();
    }, RETRY_TIMER_MS);
  } else if (!shouldRun && retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

/** Ajoute une séance terminée à la file d'attente hors-ligne (dédupliquée par id). */
export function queueSession(payload: Omit<PendingSessionPayload, "id"> & { id?: string }) {
  const item: QueuedItem = { ...payload, id: payload.id ?? crypto.randomUUID() };
  const queue = readQueue();
  const existingIdx = queue.findIndex((q) => q.id === item.id);
  if (existingIdx >= 0) {
    // Même id déjà en file : on remplace par la version la plus complète
    // plutôt que d'empiler un doublon.
    queue[existingIdx] = mostComplete(queue[existingIdx], item);
  } else {
    queue.push(item);
  }
  writeQueue(queue);
  return item;
}

export function pendingCount(): number {
  return readQueue().length;
}

export function isSyncing(): boolean {
  return syncing;
}

function setCount(exercises: Json): number {
  if (!Array.isArray(exercises)) return 0;
  let n = 0;
  for (const ex of exercises as Array<{ sets?: unknown[] }>) {
    n += Array.isArray(ex?.sets) ? ex.sets.length : 0;
  }
  return n;
}

/** Choisit la version la plus "complète" entre deux payloads du même id (plus de séries, sinon plus récente). */
function mostComplete<T extends PendingSessionPayload>(a: T, b: T): T {
  const sa = setCount(a.exercises);
  const sb = setCount(b.exercises);
  if (sa !== sb) return sa > sb ? a : b;
  return new Date(a.completed_at).getTime() >= new Date(b.completed_at).getTime() ? a : b;
}

/**
 * Envoie un item en respectant la règle de non-duplication : si une ligne
 * distante avec le même id existe déjà, on ne réinsère jamais — on garde la
 * version la plus complète (comparaison du nombre de séries / date) et on
 * met à jour cette même ligne (upsert sur id, jamais un second insert).
 */
async function syncOne(item: QueuedItem): Promise<"ok" | "retry"> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from("workout_sessions")
      .select("id, exercises, completed_at")
      .eq("id", item.id)
      .maybeSingle();
    if (fetchErr) return "retry";

    const toWrite: PendingSessionPayload = existing
      ? mostComplete(item, {
          id: existing.id,
          user_id: item.user_id,
          name: item.name,
          exercises: existing.exercises,
          muscle_groups: item.muscle_groups,
          duration_min: item.duration_min,
          completed_at: existing.completed_at ?? item.completed_at,
        })
      : item;

    const { __attempts, __nextAt, ...clean } = toWrite as QueuedItem;
    void __attempts;
    void __nextAt;

    const { error } = await supabase
      .from("workout_sessions")
      .upsert([clean], { onConflict: "id", ignoreDuplicates: false });
    if (error) return "retry";
    return "ok";
  } catch {
    return "retry";
  }
}

/** Tente d'envoyer toutes les séances en attente ; conserve celles en échec avec backoff exponentiel. */
export async function flushPendingSessions(): Promise<void> {
  if (syncing) return;
  const queue = readQueue();
  if (queue.length === 0) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  syncing = true;
  notify();
  try {
    const now = Date.now();
    const remaining: QueuedItem[] = [];
    for (const item of queue) {
      if (item.__nextAt && item.__nextAt > now) {
        remaining.push(item);
        continue;
      }
      const outcome = await syncOne(item);
      if (outcome === "retry") {
        const attempts = (item.__attempts ?? 0) + 1;
        const delay = BACKOFF_STEPS_MS[Math.min(attempts - 1, BACKOFF_STEPS_MS.length - 1)];
        remaining.push({ ...item, __attempts: attempts, __nextAt: Date.now() + delay });
      }
      // "ok" => on ne la remet pas dans la file (synchronisée / déjà présente à jour).
    }
    writeQueue(remaining);
  } finally {
    syncing = false;
    notify();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushPendingSessions();
  });
  // Démarre le minuteur de relance périodique si des éléments sont déjà en file
  // (ex. rechargement de page après un crash pendant une coupure réseau).
  ensureRetryTimer(pendingCount() > 0);
}

/** Hook d'état de synchro des séances hors-ligne (nombre en attente, envoi en cours). */
export function useSyncStatus() {
  const [pending, setPending] = useState(() => pendingCount());
  const [syncingState, setSyncingState] = useState(() => isSyncing());

  useEffect(() => {
    const listener = () => {
      setPending(pendingCount());
      setSyncingState(isSyncing());
    };
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    pending,
    syncing: syncingState,
    flush: () => void flushPendingSessions(),
  };
}
