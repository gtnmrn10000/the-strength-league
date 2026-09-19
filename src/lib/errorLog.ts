/**
 * Client-side error logging — first-party, no external DSN required.
 *
 * `logClientError` is non-blocking and never throws. It truncates inputs
 * and strips anything that looks like a token, secret, email, or a full
 * URL with a query string before it ever reaches the network or the
 * database, in `public.client_errors` (RLS insert/select own only).
 */
import { supabase } from "@/integrations/supabase/client";
import { reportToSentry } from "./sentryAdapter";

const MAX_MESSAGE_LEN = 500;
const MAX_CONTEXT_LEN = 300;

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

/** Redacts emails, bearer/JWT-looking tokens, and query strings on URLs. */
function scrub(input: string): string {
  let out = input;
  // Emails
  out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]");
  // Bearer tokens / JWTs / long opaque tokens
  out = out.replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]");
  out = out.replace(/\b[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, "[redacted-jwt]");
  out = out.replace(/\b(sk|pk|eyJ)[A-Za-z0-9_-]{15,}\b/g, "[redacted-token]");
  // Strip query strings / fragments from URLs (keep origin + path only)
  out = out.replace(/(https?:\/\/[^\s?#]+)[?#][^\s]*/g, "$1");
  return out;
}

function truncate(input: string, max: number): string {
  const scrubbed = scrub(input);
  return scrubbed.length > max ? `${scrubbed.slice(0, max)}…` : scrubbed;
}

/**
 * Logs a client error for later triage. Fire-and-forget, never throws,
 * never logs tokens/emails/full URLs with query strings.
 */
export function logClientError(error: unknown, context?: string): void {
  try {
    const rawMessage =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Erreur inconnue";
    const message = truncate(rawMessage, MAX_MESSAGE_LEN);
    const safeContext = context ? truncate(context, MAX_CONTEXT_LEN) : null;

    reportToSentry(message, safeContext ? { context: safeContext } : undefined);

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id ?? null;
        if (!userId) return; // signed out: no anonymous rows
        await supabase.from("client_errors").insert({
          user_id: userId,
          message,
          context: safeContext,
          app_version: APP_VERSION,
          platform: detectPlatform(),
        });
      } catch {
        /* never throw from error logging */
      }
    })();
  } catch {
    /* never throw from error logging */
  }
}
