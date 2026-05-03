/**
 * Lightweight analytics helper for onboarding funnel tracking.
 * Events are stored in localStorage for now; swap the `send` function
 * for any real provider (Posthog, GA, Mixpanel) later.
 */

const EVENTS_KEY = "centuria_events";

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
  timestamp: string;
}

function send(event: AnalyticsEvent) {
  // Log to console in dev
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    console.log("[analytics]", event.name, event.properties);
  }
  // Persist locally for debug / funnel review
  try {
    const existing: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
    existing.push(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(existing.slice(-200)));
  } catch {}
}

export function track(name: string, properties?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return;
  send({ name, properties, timestamp: new Date().toISOString() });
}

/** Read all stored events (for debug) */
export function getEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}
