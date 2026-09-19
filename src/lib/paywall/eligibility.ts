/**
 * Éligibilité aux formules à tarif réduit (aujourd'hui : étudiant).
 *
 * IMPORTANT — aucune vérification étudiante n'est implémentée à ce jour.
 * Tant que `STUDENT_VERIFICATION_PROVIDER` n'est pas branché, la formule
 * Étudiant est PRÉPARÉE (produit, entitlement, parcours UX) mais NON
 * ACHETABLE en production : la proposer sans contrôle reviendrait à ouvrir
 * une fraude évidente. En mode développement, elle reste sélectionnable pour
 * tester le parcours, sans aucun paiement.
 *
 * Le modèle est volontairement extensible : brancher plus tard un
 * vérificateur (SheerID, UNIDAYS, justificatif manuel modéré…) consiste à
 * implémenter `checkStudentEligibility()` et à renseigner la variable
 * d'environnement du fournisseur.
 */

const env = import.meta.env as Record<string, string | undefined>;

/** Nom du fournisseur de vérification étudiante, vide tant que rien n'est branché. */
export const STUDENT_VERIFICATION_PROVIDER = env["VITE_STUDENT_VERIFICATION_PROVIDER"] ?? "";

export type EligibilityState = "eligible" | "unverified" | "unavailable";

export function studentVerificationConfigured(): boolean {
  return STUDENT_VERIFICATION_PROVIDER.length > 0;
}

/**
 * État d'éligibilité étudiante de l'utilisateur courant.
 * Sans fournisseur branché : "unavailable" (formule non achetable).
 */
export async function checkStudentEligibility(): Promise<EligibilityState> {
  if (!studentVerificationConfigured()) return "unavailable";
  // À implémenter avec le fournisseur choisi : renvoie "eligible" / "unverified".
  return "unverified";
}

export const STUDENT_BLOCKER_COPY =
  "La formule Étudiant ouvrira dès que la vérification du statut étudiant sera en place.";
