# CENTURIA — préparation App Store / Google Play

Statut : aucune publication, aucune signature, aucun paiement réel effectué.

## Prêt

- Nom : CENTURIA. Identifiant : `app.centuria` (iOS et Android).
- Version : 1.0.0 (build 1) — `android/app/build.gradle`, Xcode `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`.
- Icônes et splash générés depuis le logo existant.
- Permissions limitées : caméra, photos, micro (descriptions FR dans `ios/App/App/Info.plist`),
  Android : INTERNET, CAMERA, RECORD_AUDIO, READ_MEDIA_IMAGES, READ_MEDIA_VIDEO.
- Suppression de compte dans l'app (Réglages → Compte), export JSON des données.
- Pages Politique de confidentialité, CGU, Contact & support (`/legal/*`).
- Restauration des achats disponible dans le paywall.
- Achat réservé au natif : sur le web, aucun achat, message explicite.
- Offre Étudiant non achetable tant que la vérification étudiante n'est pas branchée.
- Séance résiliente hors-ligne (file locale + synchronisation au retour réseau).
- Préférences de notifications par type ; enregistrement de l'appareil prêt côté code.
- Aucune clé secrète côté client ; aucune mention test/mock/IA générée visible.

## À fournir par le propriétaire

1. Comptes développeur Apple (99 $/an) et Google Play (25 $).
2. Certificat de distribution Apple + profil de provisioning ; keystore de signature Android.
3. RevenueCat : clé publique iOS (`VITE_REVENUECAT_IOS_KEY`), clé publique Android
   (`VITE_REVENUECAT_ANDROID_KEY`), secret du webhook (`REVENUECAT_WEBHOOK_SECRET`).
4. Produits d'abonnement créés dans App Store Connect et Google Play, puis leurs identifiants
   (`VITE_PRODUCT_ID_STANDARD`, `VITE_PRODUCT_ID_STUDENT`) :
   - CENTURIA STANDARD — 26,99 €/mois
   - CENTURIA ÉTUDIANT — 12,99 €/mois
5. Fournisseur de vérification du statut étudiant (`VITE_STUDENT_VERIFICATION_PROVIDER`).
6. Notifications push : clé APNs (.p8 + Key ID + Team ID) et service-account Firebase (FCM),
   puis un service d'envoi lisant `push_devices` / `notification_prefs`.
7. Clients OAuth Google et Apple pour la connexion sociale.
8. Informations juridiques réelles (société, adresse, e-mail de contact) pour remplacer
   les placeholders « À COMPLÉTER » des pages légales.

## Points d'attention App Review

- L'app native charge actuellement le site hébergé (`server.url` de `capacitor.config.ts`).
  Apple refuse fréquemment une simple coquille web : prévoir une passe pour embarquer le
  build dans le binaire avant soumission.
- Les abonnements doivent être achetés exclusivement via StoreKit / Google Play Billing :
  c'est déjà le cas, aucun lien de paiement externe ne doit être ajouté.
- L'offre Étudiant doit rester indisponible tant que la vérification n'existe pas.
- Contenu généré par les utilisateurs (vidéos, commentaires) : signalement et blocage présents,
  ce qu'Apple exige (guideline 1.2).
- Mentions santé/nutrition : avertissements présents dans les CGU.
