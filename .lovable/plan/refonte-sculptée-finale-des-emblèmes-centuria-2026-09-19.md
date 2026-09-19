# Refonte sculptée finale des emblèmes Centuria

## Objectif
Remplacer les emblèmes actuels par neuf insignes métalliques en relief conformes à la direction validée par le client, sans toucher à l’XP.

## Emblèmes
- Recrue : deux chevrons anthracite facettés, sans cercle.
- Soldat : écusson vertical et trois chevrons acier bordés de bronze.
- Guerrier : épée verticale géométrique dans une couronne de lauriers.
- Spartiate : bouclier rond riveté et casque corinthien à crête brun-rouge sombre.
- Gladiateur : casque noble dans un médaillon entouré de lauriers.
- Centurion : aigle impérial déployé, cercle et lauriers en or vieilli.
- Titan : visage blindé angulaire, vertical et monolithique en titane noir.
- Légende : tête de lion sculptée, petite couronne et lauriers en or profond.
- Divin : lance élancée, ailes platine, orbite segmentée et petit halo or pâle.

## Rendu et intégration
- Construire chaque insigne en SVG React multicouche avec volumes, ombres internes, arêtes lumineuses et texture métallique subtile.
- Conserver une lecture nette à 18–36 px et davantage de détail dans la galerie et le passage de niveau.
- Remplacer l’apparence partout via le composant central déjà utilisé par Home, Profil, Galerie, progression et level-up.
- Garder les grades verrouillés visibles en silhouette sombre.

## Mouvement
- Adapter les animations existantes aux nouvelles formes à partir de Spartiate : bouclier/crête, casque/lauriers, aigle/cercle, fissure, lion/couronne, lance/ailes/orbite.
- Garder Home et Profil quasi statiques, la galerie en reveal unique et le level-up en cérémonie d’environ deux secondes.
- Respecter la réduction des animations et éviter toute boucle agressive.

## Validation
- Inspecter les neuf grades en grand et petit.
- Tester Galerie et level-up à 320×568, 360×640, 375×667 et 390×844.
- Vérifier l’absence de débordement, d’erreur console et de régression XP.
- Valider TypeScript et le build, sans publier.
