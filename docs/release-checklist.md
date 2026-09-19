# CENTURIA — checklist de publication

Rien n'est publié ni signé. Version applicative : 1.0.0 (build 1).

## Architecture (fait)

- L'app est embarquée dans le binaire : `bun run build:native` produit
  `dist/client/index.html` + assets, `npx cap sync` les copie dans iOS/Android.
- `capacitor.config.ts` n'utilise plus d'URL de production ; `CAP_SERVER_URL`
  ne sert qu'au développement.
- La logique serveur sensible vit dans des fonctions backend distantes
  (`coach`, `food-photo`, `account`, `award-xp`, `prs`) qui vérifient le jeton
  de l'utilisateur. Aucune clé secrète dans l'app.

## iOS — état

Prêt : nom, identifiant `app.centuria`, icône, splash, permissions caméra /
photos / micro en français, suppression de compte dans l'app, restauration des
achats, pages légales et règles de la communauté, signalement et blocage.

Bloqué par des accès externes :
1. Compte Apple Developer (99 $/an).
2. Certificat de distribution + profil de provisioning.
3. Produits d'abonnement créés dans App Store Connect :
   CENTURIA STANDARD 26,99 €/mois, CENTURIA ÉTUDIANT 12,99 €/mois.
4. Clé publique RevenueCat iOS (`VITE_REVENUECAT_IOS_KEY`) + identifiants
   produits (`VITE_PRODUCT_ID_STANDARD`, `VITE_PRODUCT_ID_STUDENT`) + secret
   du webhook (`REVENUECAT_WEBHOOK_SECRET`).
5. Clé APNs (.p8 + Key ID + Team ID) si les notifications push sont activées.
6. Client OAuth Apple (Sign in with Apple) si la connexion Apple est proposée.
7. Informations juridiques réelles (société, adresse, e-mail de contact) pour
   remplacer les « À COMPLÉTER » des pages légales et l'adresse de support.

## Android — état

Prêt : `applicationId app.centuria`, versionCode 1 / versionName 1.0.0, icône,
splash, permissions minimales (INTERNET, CAMERA, RECORD_AUDIO, READ_MEDIA_*),
bouton retour géré, suppression de compte, restauration des achats.

Bloqué par des accès externes :
1. Compte Google Play Developer (25 $).
2. Keystore de signature (upload key) + Play App Signing.
3. Abonnements créés dans Google Play Console (mêmes offres).
4. Clé publique RevenueCat Android (`VITE_REVENUECAT_ANDROID_KEY`).
5. Service-account Firebase (FCM) si notifications push.
6. Client OAuth Google (Web + Android) pour la connexion Google.
7. Déclaration « Sécurité des données » + politique de confidentialité en ligne.

## Tests à faire une fois les accès fournis

- Achat sandbox iOS (compte Sandbox Tester) : souscription, annulation,
  restauration, expiration.
- Achat test Google Play (licence testeur) : souscription, remboursement,
  restauration.
- Réception d'une notification push de bout en bout (APNs + FCM).
- Connexion Google et Apple sur appareil réel.

## Étapes de publication

### TestFlight (iOS)
1. Ouvrir `ios/App/App.xcworkspace` dans Xcode, sélectionner l'équipe de
   signature, incrémenter le build si besoin.
2. Product → Archive, puis Distribute App → App Store Connect → Upload.
3. Dans App Store Connect : remplir fiche, captures (6,7" et 5,5"), politique
   de confidentialité, questionnaire données, catégorie Forme et santé.
4. Inviter les testeurs internes, vérifier les achats en sandbox.
5. Soumettre à la review avec un compte de démonstration fonctionnel.

### Test fermé (Android)
1. `bun run build:native && npx cap sync android`, puis Android Studio →
   Build → Generate Signed Bundle (AAB).
2. Play Console → créer l'app → piste de test fermé → téléverser l'AAB.
3. Remplir contenu de l'app, sécurité des données, classification du contenu.
4. Ajouter les testeurs, valider les abonnements de test.
5. Passer en production après la période de test requise.

## Points d'attention review

- Contenu généré par les utilisateurs : règles de communauté, signalement,
  blocage et masquage par un modérateur sont en place (guideline Apple 1.2).
- Abonnements exclusivement via StoreKit / Google Play Billing ; aucun lien de
  paiement externe dans l'app.
- L'offre Étudiant reste indisponible tant qu'aucune vérification du statut
  étudiant n'est branchée.
- Mentions santé et nutrition : avertissements présents dans les CGU.
