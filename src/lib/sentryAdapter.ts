/**
 * Optional, thin Sentry adapter — disabled by default.
 *
 * We do NOT install the Sentry SDK and do NOT invent a DSN. This module
 * only reads `VITE_SENTRY_DSN` from the environment; if it is absent
 * (the default), every function here is a no-op. If a real deployment
 * later sets `VITE_SENTRY_DSN` and adds the `@sentry/*` SDK as a project
 * dependency, this file is the single place to wire it up — nothing else
 * in the app needs to change since `logClientError` already calls
 * `reportToSentry` unconditionally.
 *
 * See docs/analytics.md for details.
 */

const DSN =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SENTRY_DSN) ||
  "";

export const sentryEnabled = Boolean(DSN);

/**
 * No-op unless VITE_SENTRY_DSN is set AND the Sentry SDK has been added
 * separately. We never import an SDK we haven't installed, so this stays
 * a no-op in this codebase until that's explicitly done.
 */
export function reportToSentry(_message: string, _context?: Record<string, unknown>): void {
  if (!sentryEnabled) return;
  // Intentionally inert: no SDK is bundled. Wire a real `Sentry.captureMessage`
  // call here once `@sentry/browser` (or similar) is added as a dependency.
}
