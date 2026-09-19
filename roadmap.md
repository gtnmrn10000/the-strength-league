# Sprint rebuild UX/produit CENTURIA

- [x] A. P0 — Terminer une séance : AlertDialog (plus de window.confirm), CTA sticky safe-area, écran récap "Séance terminée", refresh Training
- [x] B. Navigation : Accueil / Entraînement / Communauté / Nutrition / Profil (+ segment Feed/Classement)
- [x] C. Logger en salle : lignes compactes, précédent, timer sticky, réordonner, remplacer, séance persistée, garde-fou abandon
- [x] D. Bibliothèque ≥ 250 exercices utiles, aliases FR/EN, fallback visuel premium
- [x] E. PR sur n'importe quel exercice (sélecteur bibliothèque, validation serveur générique, exercise_id)
- [x] F. Médias : media_type image|video, URLs signées, lecture vidéo feed/profil, composer (vidéo / record / photo)
- [x] F-bis. PostDetailSheet (ouverture plein écran depuis la grille profil) — testé 360/375/390
- [x] G. Grades dérivés du XP réel, badges de force séparés, animation level-up premium, galerie verrouillée
- [x] H. Rétention : streak hebdo, objectif de semaine, résumé hebdo
- [x] I. Microcopy sans slop IA
- [x] J. QA E2E 360×640 / 375×667 / 390×844, TS + build, rapport final

## Passe Mobile Only / Store Ready
- [x] Offres CENTURIA STANDARD 26,99 € / ÉTUDIANT 12,99 €, prix store si branchés
- [x] Achat natif uniquement, aucun checkout web, restore purchases
- [x] Éligibilité étudiante bloquée tant que la vérification n'est pas branchée
- [x] Séance hors-ligne : file locale, sync auto, badge « À synchroniser »
- [x] Back button Android, reprise après arrière-plan, séance persistée
- [x] Préférences notifications + enregistrement appareil (aucun envoi simulé)
- [x] Fil paginé (15 + « Voir plus »)
- [x] Audit strings et clés, version 1.0.0, permissions minimales
- [x] QA 360×640 / 375×667 / 390×844, TS + build propres
- [x] docs/store-readiness.md
- [ ] Embarquer le build web dans le binaire natif (avant soumission App Store)

## Sprint final (avant credentials externes)
- [x] P0-1 App embarquée dans le binaire (build:native SPA + capacitor sans server.url)
- [x] P0-1b Logique serveur sensible déplacée en fonctions backend distantes (coach, food-photo, account, award-xp, prs)
- [x] P0-2 Séance indestructible (UUID client, upsert idempotent, file offline + backoff)
- [x] P0-3 Sécurité : RLS, storage, colonnes protégées, limites anti-spam, index
- [x] P0-4 XP/grades anti-triche (xp_events service role, grade dérivé du XP)
- [x] P0-5 Modération : rôles, masquage, blocages en base, filtre spam minimal
- [x] P1 Règles communauté + support/FAQ + mes signalements (UI)
- [x] P1 Analytics first-party + ErrorBoundary/journal d'erreurs
- [x] P1 Accessibilité, 320×568, performance
- [x] docs/release-checklist.md, docs/qa-data-cleanup.md
## Sprint grades premium
- [x] Créer des emblèmes SVG accessibles pour les 9 grades
- [x] Refaire la transition de passage de grade
- [x] Migrer galerie, accueil, profil et surfaces grade
- [x] Ajouter un aperçu QA hors production
- [x] Vérifier tailles mobiles, états et compilation

## Passe visuelle premium globale
- [x] Auditer les 15 écrans demandés et supprimer les marqueurs IA/template à fort impact
- [x] Réduire cartes, pills, majuscules, effets et copy générique sans changer les fonctions
- [x] Harmoniser boutons, icônes, espacements, rayons et animations courtes
- [x] Simplifier Coach, nutrition et paywall sans modifier leur logique
- [x] QA visuelle 320 / 360 / 375 / 390 px, TypeScript et build

## Animations premium des grades élevés
- [x] Signatures animées Spartiate à Divin selon le contexte
- [x] Galerie : reveal unique et pause hors viewport
- [x] Home / Profil : micro-reflet compact uniquement
- [x] Level-up : cérémonies propres à chaque grade élevé
- [x] Reduced motion et QA 320 / 360 / 375 / 390

## Refonte sculptée finale des emblèmes
- [ ] Neuf silhouettes conformes à la référence client
- [ ] Relief, facettes et textures métalliques lisibles en petit
- [ ] Animations adaptées aux nouvelles formes
- [ ] Galerie et level-up premium sur quatre tailles
- [ ] TypeScript, build et QA visuelle
