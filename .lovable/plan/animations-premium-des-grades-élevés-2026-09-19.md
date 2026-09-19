# Animations premium des grades élevés

## Objectif
Animer les emblèmes de Spartiate à Divin sans modifier leur direction visuelle, la progression XP ni les données.

## Mise en œuvre
- Étendre `GradeEmblem` avec des contextes explicites (`compact`, `gallery`, `level-up`) afin de limiter chaque animation à son usage.
- Donner à chaque grade élevé une signature distincte : lumière et respiration pour Spartiate, casque/lauriers et profondeur pour Gladiateur, ailes et double ring pour Centurion, fissure/masse pour Titan, lauriers/double halo pour Légende, assemblage orbital et balayage platine pour Divin.
- Garder Recrue, Soldat et Guerrier statiques, sauf un reflet unique lorsqu’il est explicitement demandé.
- Déclencher les animations de galerie une seule fois à l’entrée dans l’écran, puis les mettre en pause hors écran. Les grades verrouillés restent presque immobiles.
- Rendre Home et Profil quasi statiques avec un micro-reflet unique, réservé aux emblèmes débloqués.
- Adapter le passage de niveau pour amplifier la séquence propre au nouveau grade, sans flash, particules, son ni boucle agressive.
- Respecter `prefers-reduced-motion` et conserver une apparence complète lorsque le mouvement est désactivé.

## Validation
- Vérifier Home, Profil, galerie et les six passages de niveau dans l’aperçu DEV.
- Tester 320×568, 360×640, 375×667 et 390×844, avec et sans réduction des animations.
- Contrôler l’absence de débordement, d’erreurs console et de régression visuelle.
- Valider TypeScript et le build final, sans déployer.
