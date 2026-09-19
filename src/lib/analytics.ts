/**
 * First-party product analytics — no external SaaS involved.
 *
 * Events are written to `public.analytics_events` (Supabase/Postgres),
 * RLS-scoped to the authenticated user. `track()` is:
 *  - non-blocking (fire-and-forget, never awaited by callers)
 *  - never throwing (all failures are swallowed)
 *  - a silent no-op when signed out (no anonymous rows)
 *  - lightly batched/debounced (flushes every ~2s or every 10 events)
 *
 * PRIVACY: `props` must never contain PII — no emails, names, phone
 * numbers, precise location, free-text user content, or auth tokens.
 * Only small, non-identifying attributes (ids, enums, counts, durations,
 * booleans). See docs/analytics.md.
 */
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventName =
  | "signup_completed"
  | "onboarding_completed"
  | "workout_started"
  | "workout_resumed"
  | "workout_completed"
  | "workout_sync_failed"
  | "exercise_added"
  | "pr_created"
  | "pr_verified"
  | "post_created"
  | "paywall_viewed"
  | "purchase_started"
  | "grade_unlocked"
  | "account_deleted";

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type QueuedEvent = {
  event: string;
  props: AnalyticsProps;
  app_version: string | null;
  platform: string | null;
  created_at: string;
};

const FLUSH_INTERVAL_MS = 2000;
const MAX_BATCH_SIZE = 10;
const MAX_PROPS_KEYS = 20;

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let cachedUserId: string | null | undefined; // undefined = unknown, null = signed out

const APP_VERSION =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_VERSION) ||
  null;

function detectPlatform(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

const PLATFORM = detectPlatform();

/** Best-effort, cached auth state. Never throws. */
async function getUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  try {
    const { data } = await supabase.auth.getUser();
    cachedUserId = data?.user?.id ?? null;
  } catch {
    cachedUserId = null;
  }
  return cachedUserId;
}

// Keep the cached auth state in sync so sign-in/out is reflected immediately.
try {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
  });
} catch {
  /* supabase not ready yet — getUser() fallback still works */
}

/** Strips obviously risky keys/values defensively (belt-and-suspenders; callers must not pass PII). */
function sanitizeProps(props: AnalyticsProps | undefined): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = {};
  const entries = Object.entries(props).slice(0, MAX_PROPS_KEYS);
  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    if (/(email|token|password|phone|secret|address|lastname|firstname)/.test(lowerKey)) {
      continue; // never forward likely-PII keys, even if a caller made a mistake
    }
    if (typeof value === "string") {
      out[key] = value.slice(0, 200);
    } else {
      out[key] = value ?? null;
    }
  }
  return out;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    const userId = await getUserId();
    if (!userId) return; // signed out: silently drop, no anonymous rows
    const rows = batch.map((e) => ({
      user_id: userId,
      event: e.event,
      props: e.props,
      app_version: e.app_version,
      platform: e.platform,
      created_at: e.created_at,
    }));
    await supabase.from("analytics_events").insert(rows);
  } catch {
    // Never throw from analytics; drop the batch silently.
  }
}

/**
 * Fire-and-forget analytics tracking. Never throws, never blocks the caller,
 * and silently no-ops when the user is signed out.
 */
export function track(event: AnalyticsEventName | (string & {}), props?: AnalyticsProps): void {
  try {
    queue.push({
      event,
      props: sanitizeProps(props),
      app_version: APP_VERSION,
      platform: PLATFORM,
      created_at: new Date().toISOString(),
    });
    if (queue.length >= MAX_BATCH_SIZE) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      void flush();
    } else {
      scheduleFlush();
    }
  } catch {
    /* never throw */
  }
}

// Best-effort flush on tab hide/close so short sessions aren't lost.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => void flush());
}
