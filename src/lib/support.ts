import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION, getPlatform } from "@/lib/appVersion";

/**
 * Adresse de contact support. Volontairement un placeholder explicite tant
 * que l'éditeur n'a pas configuré une vraie boîte e-mail — ne jamais
 * inventer une adresse réelle ici.
 */
export const SUPPORT_EMAIL = "support@centuria.app  // À CONFIGURER";

/** true tant que SUPPORT_EMAIL n'a pas été renseignée par l'éditeur. */
export const SUPPORT_EMAIL_CONFIGURED = false;

export const BUG_CATEGORIES: { value: string; label: string }[] = [
  { value: "bug", label: "Bug / erreur" },
  { value: "crash", label: "Plantage de l'app" },
  { value: "data", label: "Donnée incorrecte" },
  { value: "feature", label: "Suggestion" },
  { value: "other", label: "Autre" },
];

export async function submitBugReport(input: { category: string; message: string }) {
  const text = input.message.trim();
  if (!text) throw new Error("Décris le problème avant d'envoyer.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour envoyer un rapport.");
  const { error } = await supabase.from("bug_reports").insert({
    user_id: user.id,
    category: input.category,
    message: text.slice(0, 4000),
    app_version: APP_VERSION,
    platform: getPlatform(),
  });
  if (error) throw error;
}
