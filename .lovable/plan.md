# Fin du sprint et passe premium des grades

## Ordre d’exécution
1. Fermer les éléments encore ouverts du sprint en cours sans étendre leur périmètre : accessibilité mobile, performance, routines, nutrition et audit de suppression de compte.
2. Remplacer les images de grades par un système SVG uniforme et accessible.
3. Refaire la galerie, les affichages compacts et la transition de passage de grade.
4. Ajouter un aperçu QA strictement réservé au développement, puis vérifier les tailles mobiles et la compilation.

## Grades
- Créer `GradeEmblem`, avec une construction commune, neuf symboles distincts, des finitions métalliques sobres et des variantes `current`, `unlocked` et `locked`.
- Conserver `GradeIcon` comme adaptateur temporaire pour migrer sans casser les usages secondaires, mais supprimer sa dépendance aux PNG.
- Utiliser les nouveaux emblèmes dans la galerie, l’accueil, le profil, les classements, le fil et les profils publics.
- Refaire la galerie sous forme de liste dense : emblème, nom, seuil XP, état et anneau de progression sur le grade courant.

## Passage de grade
- Construire une séquence plein écran de 1,8 à 2,4 secondes : ancien grade en retrait, ligne métallique, apparition contrôlée, tracé du ring, balayage lumineux et CTA différé.
- Nuancer la séquence selon le rang, sans confettis, son, flash agressif ni animation permanente.
- Respecter `prefers-reduced-motion`; utiliser le retour haptique seulement sur appareil natif si le plugin est déjà disponible.
- Afficher le total XP et la progression suivante uniquement lorsque ces valeurs sont fournies, sans modifier le calcul XP.

## QA
- Ajouter une page d’aperçu uniquement en mode développement pour voir les neuf états et simuler les six transitions demandées, sans écriture ni appel distant.
- Tester les états verrouillé, débloqué et courant à 320×568, 360×640, 375×667 et 390×844.
- Vérifier TypeScript, build et absence de débordement, puis documenter les captures et tests réalisés.

## Détails techniques
- SVG React avec identifiants de dégradés uniques, couleurs pilotées par les styles globaux, labels accessibles et fallback textuel masqué visuellement.
- Framer Motion pour les séquences courtes et le stagger; aucune boucle coûteuse.
- Aucun changement de migration, de logique XP ou de données utilisateur. Aucun déploiement ni achat.
