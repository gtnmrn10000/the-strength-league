import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const QUEUE_KEY = "centuria:pending-sessions";

export type PendingSessionPayload = {
  id: string;
  user_id: string;
  name: string;
  exercises: Json;
  muscle_groups: string[];
  duration_min: number | null;
  completed_at: string;
};

type Listener = () => void;
const listeners = new Set<Listener>();
let syncing = false;

function notify() {
  for (const l of listeners) l();
}

function readQueue(): PendingSessionPayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingSessionPayload[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* quota — sans gravité */
  }
  notify();
}

/** Ajoute une séance terminée à la file d'attente hors-ligne. */
export function queueSession(payload: Omit<PendingSessionPayload, "id"> & { id?: string }) {
  const item: PendingSessionPayload = { ...payload, id: payload.id ?? crypto.randomUUID() };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return item;
}

export function pendingCount(): number {
  return readQueue().length;
}

export function isSyncing(): boolean {
  return syncing;
}

/** Tente d'envoyer toutes les séances en attente ; conserve celles en échec. */
export async function flushPendingSessions(): Promise<void> {
  if (syncing) return;
  const queue = readQueue();
  if (queue.length === 0) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  syncing = true;
  notify();
  try {
    const remaining: PendingSessionPayload[] = [];
    for (const item of queue) {
      try {
        const { error } = await supabase.from("workout_sessions").upsert(item, { onConflict: "id" });
        if (error) remaining.push(item);
      } catch {
        remaining.push(item);
      }
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
