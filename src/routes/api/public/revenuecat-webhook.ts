/**
 * Webhook RevenueCat — source de vérité serveur pour les entitlements.
 *
 * À brancher dans le dashboard RevenueCat (Project → Integrations → Webhooks) :
 *   URL    : https://<domaine>/api/public/revenuecat-webhook
 *   Header : Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 *
 * Tant que le secret `REVENUECAT_WEBHOOK_SECRET` n'est pas renseigné dans
 * Réglages du projet → Secrets, l'endpoint répond 503 : rien n'est inventé,
 * aucun entitlement n'est accordé.
 */
import { createFileRoute } from "@tanstack/react-router";

type RCEvent = {
  type?: string;
  app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number | null;
  store?: string;
};

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
]);
const INACTIVE_EVENTS = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"]);

export const Route = createFileRoute("/api/public/revenuecat-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["REVENUECAT_WEBHOOK_SECRET"];
        if (!secret) {
          return new Response("RevenueCat webhook non configuré", { status: 503 });
        }
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { event?: RCEvent };
        try {
          body = (await request.json()) as { event?: RCEvent };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = body.event;
        const userId = event?.app_user_id;
        const type = event?.type ?? "";
        if (!userId) return new Response("Missing app_user_id", { status: 400 });

        const active = ACTIVE_EVENTS.has(type);
        if (!active && !INACTIVE_EVENTS.has(type)) {
          return new Response("ignored", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: active,
            premium_provider: active ? "revenuecat" : null,
            premium_product_id: active ? (event?.product_id ?? null) : null,
            premium_expires_at:
              active && event?.expiration_at_ms
                ? new Date(event.expiration_at_ms).toISOString()
                : null,
            premium_will_renew: active && type !== "NON_RENEWING_PURCHASE",
            premium_store_user_id: userId,
            premium_updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) return new Response("DB error", { status: 500 });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
