import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Notifications push — préparation du terrain uniquement.
 *
 * Aucun message n'est réellement envoyé aujourd'hui : il n'existe pas encore
 * de fournisseur de push côté serveur. Pour activer l'envoi il faudra plus
 * tard :
 *   - iOS  : une clé APNs (Apple Push Notification service) — .p8 + Key ID +
 *            Team ID, ou un certificat push, déclarés dans le fournisseur
 *            de push choisi (ex: Supabase Edge Function + APNs HTTP/2, ou
 *            un service tiers type OneSignal/Firebase).
 *   - Android : un compte de service FCM (Firebase Cloud Messaging) —
 *            fichier JSON de service account du projet Firebase.
 *
 * Ce fichier ne fait que : détecter le support natif, demander la
 * permission, enregistrer le token de l'appareil dans `push_devices`, et
 * lire/écrire les préférences de notifications dans `notification_prefs`.
 */

type NotificationPrefsRow = Database["public"]["Tables"]["notification_prefs"]["Row"];

export type NotificationPrefs = Omit<NotificationPrefsRow, "user_id" | "updated_at">;

const DEFAULT_PREFS: NotificationPrefs = {
  push_enabled: false,
  comments: true,
  pr_votes: true,
  followers: true,
  grades: true,
  workout_reminder: true,
};

/** true uniquement sur iOS/Android natif (jamais sur web/PWA). */
export function isPushSupported(): boolean {
  return Capacitor.isNativePlatform();
}

type RegisterResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "plugin-missing" | "no-user" | "permission-denied" | "error" };

/**
 * Demande la permission, enregistre l'appareil auprès du système
 * (APNs/FCM natifs), puis stocke le token obtenu dans `push_devices`.
 *
 * Ne lance jamais d'exception : toute erreur revient sous forme de
 * `{ ok: false, reason }` pour que l'UI reste sobre.
 */
export async function registerPush(): Promise<RegisterResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  let PushNotifications: typeof import("@capacitor/push-notifications").PushNotifications;
  try {
    // Import dynamique : le plugin n'est pas forcément installé tant que les
    // identifiants APNs/FCM ne sont pas prêts côté build natif.
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    return { ok: false, reason: "plugin-missing" };
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, reason: "no-user" };

  const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";

  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return { ok: false, reason: "permission-denied" };

    return await new Promise<RegisterResult>((resolve) => {
      let settled = false;

      PushNotifications.addListener("registration", (token) => {
        if (settled) return;
        settled = true;
        void supabase
          .from("push_devices")
          .upsert(
            {
              user_id: userId,
              platform,
              token: token.value,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "token" },
          )
          .then(({ error }) => {
            resolve(error ? { ok: false, reason: "error" } : { ok: true });
          });
      });

      PushNotifications.addListener("registrationError", () => {
        if (settled) return;
        settled = true;
        resolve({ ok: false, reason: "error" });
      });

      void PushNotifications.register();
    });
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Supprime les tokens de cet appareil pour l'utilisateur courant. */
export async function unregisterPush(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return false;

  try {
    if (isPushSupported()) {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        await PushNotifications.removeAllDeliveredNotifications();
        await PushNotifications.unregister();
      } catch {
        // Plugin absent ou déjà désenregistré — sans conséquence.
      }
    }

    const { error } = await supabase.from("push_devices").delete().eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

/** Lit les préférences de notifications, en créant la ligne par défaut au besoin. */
export async function getPushPrefs(): Promise<NotificationPrefs> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return DEFAULT_PREFS;

  const { data, error } = await supabase
    .from("notification_prefs")
    .select("push_enabled, comments, pr_votes, followers, grades, workout_reminder")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    const { data: created } = await supabase
      .from("notification_prefs")
      .insert({ user_id: userId, ...DEFAULT_PREFS })
      .select("push_enabled, comments, pr_votes, followers, grades, workout_reminder")
      .maybeSingle();
    return created ?? DEFAULT_PREFS;
  }

  return data;
}

/** Met à jour partiellement les préférences de l'utilisateur courant. */
export async function savePushPrefs(partial: Partial<NotificationPrefs>): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return false;

  const { error } = await supabase
    .from("notification_prefs")
    .upsert(
      { user_id: userId, ...DEFAULT_PREFS, ...partial, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  return !error;
}
