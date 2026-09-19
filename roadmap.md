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
