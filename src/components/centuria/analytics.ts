/**
 * Onboarding-funnel debug helper. Delegates real tracking to the
 * first-party analytics pipeline (`@/lib/analytics`), and additionally
 * keeps a small local ring-buffer in localStorage purely for on-device
 * debugging of the funnel (never sent anywhere).
 */
import { track as trackEvent } from "@/lib/analytics";

const EVENTS_KEY = "centuria_events";

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
  timestamp: string;
}

function persistLocal(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  try {
    const existing: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
    existing.push(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(existing.slice(-200)));
  } catch {
    /* noop */
  }
}

export function track(name: string, properties?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV) {
    console.log("[analytics]", name, properties);
  }
  persistLocal({ name, properties, timestamp: new Date().toISOString() });
  trackEvent(name, properties ?? undefined);
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
