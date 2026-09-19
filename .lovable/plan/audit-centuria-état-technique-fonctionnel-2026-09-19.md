# Audit Centuria — État technique & fonctionnel

Audit uniquement, aucun fichier modifié. Date : 2026-09-19.

---

## 1. Build / TypeScript

**Résultat : fonctionnel.**

- `bunx tsc --noEmit` : aucune erreur.
- Dernier build (`/tmp/observability/build-errors.log`) : `build OK` le 18/09 à 15:43 UTC.
- RouteTree généré correctement : `/`, `/discover`, `/profile/$userId`.

---

## 2. Onboarding + Authentification réelle

**Résultat : NON FONCTIONNEL / mock.**

- Le seul appel auth dans tout le code est `supabase.auth.signInAnonymously()` dans `src/components/centuria/Shell.tsx:72`.
- L'écran onboarding `src/components/centuria/Onboarding.tsx` affiche bien des boutons « Continuer avec Apple / Google / e-mail » (étape 1, `AuthStep`), mais ce sont des `<button>` sans `onClick` — purement décoratifs.
- Aucune route `/auth`, `/login`, `/reset-password`, `/auth/callback`.
- L'onboarding persiste localement (`localStorage` : `centuria_onboarding`, `centuria_profile`), mais il n'y a aucun compte utilisateur côté backend.
- Le bouton « J'ai déjà un compte » sur l'écran d'accueil est inactif.

**Impact P0 :** perte totale des données au changement d'appareil / navigateur / cache vidé ; impossible de reconstruire une session ; le social (follow, votes, feed) repose sur des UUID anonymes jetables.

**Pour aller en prod :** implémenter un vrai flow (e-mail + Google + Apple via Lovable Cloud), activer `enable_email_auth`, prévoir la migration `link_identity` des comptes anonymes existants vers des vrais comptes.

---

## 3. Sauvegarde d'une séance et RLS

**Résultat : PARTIELLEMENT FONCTIONNEL — bloqué en mode anonyme actuel.**

- `src/components/centuria/WorkoutLogger.tsx:101` insère bien dans `workout_sessions` avec `user_id`, `name`, `exercises`, `muscle_groups`, `duration_min`, `completed_at`.
- L'UI permet de choisir un template, ajouter des exercices depuis la bibliothèque, modifier reps/poids, ajouter/supprimer des séries, timer de repos, terminer.
- Cependant la politique RLS sur `workout_sessions` exige `COALESCE(((auth.jwt() ->> 'is_anonymous'::text))::boolean, false) IS FALSE`. En mode anonyme, `is_anonymous = true`, donc **l'insertion est refusée**.

**Impact P0 :** dans la configuration actuelle, un utilisateur ne peut pas enregistrer sa séance. Dès que le vrai auth sera en place, ce blocage disparaît. À noter : le même blocage s'applique à toutes les tables personnelles (`food_logs`, `weigh_ins`, `coach_conversations`, `prs`, `posts`, etc.).

---

## 4. Bibliothèque d'exercices

**Résultat : FONCTIONNEL.**

- `src/lib/exerciseCatalog.ts` contient **52 exercices** répartis en 6 catégories :
  - Pectoraux : 8
  - Dos : 9
  - Jambes : 10
  - Épaules : 8
  - Bras : 9
  - Abdos : 8
- Chaque exercice a un nom, un muscle principal, des muscles secondaires, une catégorie et une image via `free-exercise-db` (domaine public).
- La table `public.exercises` existe côté Supabase mais **n'est pas utilisée dans l'UI** ; la bibliothèque est hardcodée.
- Les templates `src/lib/workoutTemplates.ts` (Push / Pull / Legs) couvrent les 3 mouvements principaux et s'intègrent au logger.

**Non-bloquant :** pas de vraie synchro entre la table DB et le catalogue code. Pour l'instant le catalogue statique suffit pour une v1.

---

## 5. Création / modification de séance

**Résultat : FONCTIONNEL en UI, NON SAUVEGARDÉ à cause du blocage auth/RLS.**

- `src/components/centuria/Training.tsx` permet :
  - Créer une séance vide (`+ CRÉER UNE SÉANCE`) et ajouter des exercices depuis la bibliothèque.
  - Choisir un template Push / Pull / Legs.
  - Modifier le nombre de reps et le poids par série (`NumberInput`).
  - Ajouter / supprimer des séries et des exercices.
  - Démarrer la séance → ouvre `WorkoutLogger` avec timer de repos.
  - Terminer → insertion en base.
- Historique des 20 dernières séances affiché avec volume, durée, groupes musculaires.
- Séances programmées (`scheduled_for`) affichées avec bouton Démarrer / Supprimer.

**Manque :** pas d'édition d'une séance déjà enregistrée (recharge un template au lieu de repartir de l'historique), pas de duplication.

---

## 6. Nutrition

**Résultat : FONCTIONNEL.**

- `src/components/centuria/Meals.tsx` gère :
  - Scan code-barre (`BarcodeScanner.tsx`) via ZXing.
  - Recherche Open Food Facts + base communautaire `community_foods`.
  - Photo IA (`src/lib/foodPhoto.functions.ts`) via Gemini 2.5 Pro, avec `PhotoAdjustSheet` pour corriger le grammage manuellement.
  - Saisie manuelle (`ManualEntrySheet`).
  - Journal par jour avec calendrier (`react-day-picker`).
  - Suppression d'entrée.
  - Objectifs macro calculés depuis le TDEE (Mifflin-St Jeor) sur la base du profil.
- La base communautaire `community_foods` est bien peuplée automatiquement depuis les scans manuels.

**Limites :** la reconnaissance visuelle reste une estimation (même avec le prompt renforcé) ; l'utilisateur doit confirmer le poids. C'est acceptable pour une v1.

---

## 7. Feed / Social / Profils / PR / Validation

**Résultat : FONCTIONNEL en code, mais dépend du nombre d'utilisateurs réels.**

- `src/lib/social.ts` : feed algorithme (score recency / hype / follow), profils publics, follow/unfollow, suggestions, listes followers/following, hype, création de post.
- `src/components/centuria/social/PostCard.tsx` : boutons Hype, vote Valide/Douteux sur les PR, badge de statut.
- `src/lib/prs.functions.ts` : `voteOnPR` avec seuils net +5 votes « Valide » → `verified`, ou >50 % « Douteux » (min 5 votes) → `contested`. Le grade/XP se débloque uniquement au passage `verified`.
- Routes `/discover` et `/profile/$userId` existent et fonctionnent.
- Le PR flow (`src/components/centuria/PRFlow.tsx`) upload une vidéo dans `pr-videos` et crée un PR ; le trigger DB crée automatiquement un post `pr` dans le feed.

**Problèmes / manques :**
- Aucune notification (nouveau follower, PR validé, nouveau vote, commentaire).
- Aucun commentaire sur les posts.
- Aucun signalement / modération de contenu (risque avec des vidéos publiques).
- Aucune recherche d'utilisateur.
- Le vote communautaire nécessite plusieurs utilisateurs ; avec un seul testeur, les PR restent en pending.

---

## 8. Premium / Paywall / Achats

**Résultat : MOCK / NON FONCTIONNEL.**

- `src/lib/paywall/provider.ts` : `MockPaywallProvider` lit juste `is_current_user_premium()`.
- `src/lib/qaMode.ts` : `QA_MODE = true` force `isPremium = true` côté client et override la RPC côté serveur pour que tout utilisateur connecté soit traité comme premium.
- `src/components/centuria/paywall/Paywall.tsx` : les boutons « S'ABONNER » et « Restaurer un achat » affichent un toast `Bientôt disponible — intégration RevenueCat en cours.` ; aucun vrai paiement.
- Aucune intégration Stripe / Paddle / RevenueCat activée.

**Impact P0 pour un lancement :** il faut brancher un vrai provider de paiement et passer `QA_MODE = false`.

---

## 9. Préparation mobile native

**Résultat : PARTIELLEMENT PRÊT.**

- `capacitor.config.ts` présent avec `appId: 'app.centuria'`, `appName: 'Centuria'`, `webDir: 'dist'`.
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/camera` installés.
- `src/lib/nativeMedia.ts` : wrapper `capturePhoto()` utilise le plugin natif quand disponible, sinon fallback `<input type="file">`. `captureVideo()` est encore en fallback web.
- `ios-permissions.md` documente les clés `Info.plist` (Camera, PhotoLibrary, Microphone, etc.).

**Manque :**
- Les plateformes iOS / Android ne sont pas ajoutées (`npx cap add ios/android` jamais lancé).
- Aucune icône, splash screen, assets adaptatifs.
- Aucun test sur appareil réel.
- Pas de gestion des safe areas ni de la barre de statut native (le CSS `max-w-md` fonctionne en webview mais mérite vérification).

---

## 10. Blocages P0 aujourd'hui

| # | Problème | Fichier(s) concerné(s) | Bloque l'usage ? |
|---|----------|------------------------|------------------|
| 1 | Aucun compte utilisateur réel | `Shell.tsx:72`, `Onboarding.tsx:263-289` | Oui — données non persistables |
| 2 | Onboarding : boutons auth inactifs | `Onboarding.tsx:AuthStep` | Oui — impasse produit |
| 3 | Enregistrement séance refusé en anonyme | politique `workout_sessions` + `WorkoutLogger.tsx:101` | Oui |
| 4 | Aucun paiement réel | `Paywall.tsx`, `provider.ts`, `qaMode.ts` | Oui pour monétisation |
| 5 | Sign-out inutile (session anonyme recrée) | `Settings.tsx:53-65`, `Shell.tsx:66-87` | Oui — expérience cassée |
| 6 | Pas de pages légales / suppression compte | n/a | Oui — rejet App Store probable |
| 7 | Classements en données statiques | `Rankings.tsx:6-13` | Non critique mais fausse l'expérience |
| 8 | Quick stats du feed en dur | `Feed.tsx:87-99` | Non critique mais informatives fausses |
| 9 | Aucune notification / modération sociale | n/a | Non P0 immédiat mais nécessaire à l'échelle |

---

## Synthèse par module

| Module | État |
|--------|------|
| Build / TypeScript | Fonctionnel |
| Authentification réelle | **Non fonctionnel (P0)** |
| Profil / Onboarding | UI OK, persistance locale, mais pas de compte |
| Entraînement / séances | UI complète, **sauvegarde bloquée par RLS anonyme** |
| Bibliothèque d'exercices | Fonctionnel (52 exos, images) |
| Nutrition (scan, photo IA, manuel) | Fonctionnel |
| Feed social / PR / votes | Fonctionnel en code, manque notifications/moderation |
| Grades / XP | Fonctionnel, liés aux PR vérifiés |
| Classements | Mock statique |
| Premium / Paiement | Mock (QA mode) |
| Mobile Capacitor | Config OK, pas de build natif |

---

## Recommandation de priorité

1. **Authentification réelle** (e-mail, Google, Apple) + migration des sessions anonymes.
2. **Pages légales + suppression de compte** (CGU / confidentialité).
3. **Paywall réel** (Stripe / Paddle / RevenueCat selon la stratégie choisie) + `QA_MODE = false`.
4. **Notifications** et modération du feed.
5. **Build iOS/Android** + assets natifs + tests sur téléphone.
6. **Classements dynamiques** et quick stats réelles du feed.
