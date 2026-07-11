/**
 * QA_MODE — single source of truth for the preview/QA no-limits mode.
 *
 * When `true`:
 *  - Toute session authentifiée est considérée premium côté client
 *    (useSubscription force `isPremium=true`).
 *  - `openPaywall` devient un no-op (aucun paywall ne peut s'ouvrir).
 *  - Tous les grades sont visibles dans la galerie sans être atteints.
 *  - Aucune limite/quota applicatif n'est appliqué.
 *
 * Côté serveur, la RPC `is_current_user_premium` a été overridée pour
 * renvoyer `true` à tout utilisateur connecté — donc les server functions
 * gated (Coach IA, Photo IA, recettes/analyses) passent aussi.
 *
 * ⚠️ Avant la mise en prod avec paiements réels (RevenueCat) :
 *   1. Passer `QA_MODE` à `false`.
 *   2. Restaurer la RPC `is_current_user_premium` pour qu'elle lise
 *      `profiles.is_premium` au lieu de renvoyer `auth.uid() IS NOT NULL`.
 */
export const QA_MODE = true;
