/**
 * Traduit les erreurs Postgres/Supabase en messages français lisibles.
 * Les triggers DB (blocages, spam, limites de fréquence) renvoient déjà des
 * messages en français via RAISE EXCEPTION : on les affiche tels quels.
 * On ne traduit ici que les cas génériques (contraintes, réseau, inconnu).
 */
export function friendlyError(e: unknown, fallback = "Une erreur est survenue."): string {
  const err = e as { message?: string; code?: string } | undefined;
  const raw = (err && typeof err.message === "string" ? err.message : e instanceof Error ? e.message : "") || "";
  const code = err?.code;
  const m = raw.toLowerCase();

  if (code === "23505" || m.includes("duplicate key")) return "Action déjà effectuée.";
  if (m.includes("interaction impossible")) return "Interaction impossible avec cet utilisateur.";
  if (m.includes("refusé (spam)") || m.includes("refusée (spam)")) return raw;
  if (m.includes("trop de commentaires")) return raw;
  if (m.includes("limite de publications")) return raw;
  if (m.includes("limite d'abonnements") || m.includes("limite d’abonnements")) return raw;
  if (m.includes("limite de votes")) return raw;
  if (m.includes("limite de signalements")) return raw;
  if (m.includes("not authorized") || m.includes("row-level security")) {
    return "Action non autorisée.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Connexion impossible. Vérifie ta connexion internet.";
  }
  // Les messages déjà en français (accents ou mots-clés courants) sont conservés tels quels.
  if (/[àâäéèêëïîôöùûüç]/i.test(raw) || /^(connecte|entre|choisis)/i.test(raw)) return raw;
  return raw && raw.length < 140 ? raw : fallback;
}
