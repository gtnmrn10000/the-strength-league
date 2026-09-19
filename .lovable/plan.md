# Polish produit final Centuria

## Objectif
Finaliser l’expérience mobile sans modifier la direction artistique, la logique XP ni les garanties hors-ligne. L’IA reste limitée au Coach conversationnel et à l’analyse réelle des records Squat, Bench et Deadlift.

## Travaux prévus

### 1. Lisibilité mobile et grades
- Agrandir les emblèmes dans les contextes où leurs détails comptent, notamment la galerie, le profil et les écrans de présentation.
- Transformer l’aperçu dense en présentation mobile respirante, sans nouvelle palette ni effets artificiels.
- Vérifier les neuf grades, les états verrouillé/courant/débloqué et la cérémonie de niveau.

### 2. Profil complet
- Consolider l’écran existant de modification avec photo, bannière, pseudo, bio et objectif.
- Ajouter aperçu, compression raisonnable, remplacement et suppression propre des médias personnels.
- Afficher le profil public avec bannière, avatar chevauchant, grade, rangs et statistiques sociales réelles.

### 3. Classement, accueil et nutrition
- Étendre le classement avec vues Global et Mon grade, rang personnel, XP, avatar et emblème, avec chargement progressif.
- Afficher les rangs global et dans le grade sur le profil et l’accueil.
- Réorganiser l’accueil autour de données déterministes : grade, XP, rang, séance du jour, récupération et nutrition enregistrée.
- Garder la nutrition entièrement manuelle, sans analyse photo.

### 4. Coach conversationnel
- Restaurer le chat Coach à partir du service existant, avec historique, suggestions, saisie collante et effacement de l’historique.
- Conserver les onglets Chat, Récupération et Analyse.
- Afficher clairement les indisponibilités et limites réelles ; aucune réponse simulée.
- Employer « Coach » dans l’interface, sans badge ou iconographie IA générique.

### 5. Social, séances et réglages
- Ajouter des retours tactiles natifs sobres lorsque disponibles et une copie de lien si le partage natif ne l’est pas.
- Uniformiser les réactions sociales avec des animations brèves, désactivées en mouvement réduit.
- Simplifier la lecture des modèles, séances planifiées, historique et reprise sans toucher à l’auto-enregistrement, au mode hors-ligne ou à l’idempotence XP.
- Recomposer les réglages en listes mobiles et supprimer les promesses Premium obsolètes.

### 6. Validation
- Tester les parcours à 320, 360, 375 et 390 px, dont clavier des commentaires et du Coach.
- Vérifier accessibilité, erreurs visibles, absence de boutons morts et absence de marqueurs IA hors des deux usages autorisés.
- Valider TypeScript, version web, version native et synchronisation Android/iOS.
- Mettre à jour la roadmap uniquement avec les éléments réellement vérifiés.

## Limites assumées
- Aucune publication, aucun achat et aucun branchement Apple, Google, RevenueCat, APNs/FCM ou fournisseur externe.
- L’analyse vidéo SBD restera indiquée indisponible tant que son fournisseur réel n’est pas branché.
- Aucun changement de règles XP, grades ou synchronisation hors-ligne.

## Détails techniques
- Réutiliser les tables, politiques d’accès, stockage personnel, fonctions de rang et historique Coach existants avant toute extension.
- Les nouveaux calculs de rang doivent venir de données réelles et être protégés côté serveur.
- Les médias de profil seront limités à l’espace du propriétaire ; les anciens fichiers remplacés seront nettoyés quand cela peut être fait sans risque.
