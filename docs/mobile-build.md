# Centuria — Build mobile natif (Capacitor)

## Vue d'ensemble

L'app est rendue côté serveur (TanStack Start + server functions). Le build client
ne contient **pas** d'`index.html` autonome : le shell natif charge donc l'app
hébergée, définie dans `capacitor.config.ts` → `server.url`
(par défaut `https://centuriapp.lovable.app`).

- `appId` : `app.centuria`
- `appName` : `Centuria`
- `webDir` : `dist/client`
- Deep link OAuth : `app.centuria://auth/callback` (iOS `CFBundleURLTypes`,
  Android `intent-filter` déjà configurés)

Pour pointer vers un autre environnement :

```bash
CAP_SERVER_URL="https://id-preview--<id>.lovable.app" npx cap sync
```

## Prérequis

| Plateforme | Outils |
| --- | --- |
| iOS | macOS, Xcode 15+, CocoaPods (`sudo gem install cocoapods`), compte Apple Developer |
| Android | Android Studio Ladybug+, JDK 17, Android SDK 34+ |

## Build local

```bash
bun install
bun run build          # génère dist/client
npx cap sync           # copie le web + met à jour les plugins natifs
npx cap open ios       # ouvre Xcode
npx cap open android   # ouvre Android Studio
```

iOS : dans Xcode, sélectionner la cible `App`, régler *Signing & Capabilities*
avec ton Team Apple, puis Run sur simulateur ou appareil.
Android : Run sur émulateur ou appareil ; pour un AAB de release,
`Build > Generate Signed Bundle`.

> Aucun certificat n'est fourni ni généré ici. Le signing doit être fait avec
> tes propres identifiants Apple / Google.

## Permissions natives (déjà en place)

- iOS `ios/App/App/Info.plist` : `NSCameraUsageDescription`,
  `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`,
  `NSMicrophoneUsageDescription` (textes en français).
- Android `android/app/src/main/AndroidManifest.xml` : `CAMERA`,
  `RECORD_AUDIO`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` + features caméra/micro
  optionnelles.

## Médias

- Photo (scan aliment) : `@capacitor/camera` en natif, `input[type=file]` en web
  (`src/lib/nativeMedia.ts`).
- Vidéo (PR) : pas de plugin vidéo officiel Capacitor ; la WebView native ouvre
  la caméra système via `input[type=file] capture`. Fallback web identique.

## Plugins natifs configurés

`@capacitor/status-bar` (thème sombre), `@capacitor/keyboard` (resize natif),
`@capacitor/splash-screen` (fond `#0B0B0D`), `@capacitor/app` (deep links OAuth),
`@capacitor/browser`. Initialisation : `src/lib/native.ts` (`initNativeShell`),
appelée depuis `Shell.tsx`. Sans effet sur le web.

## Icônes & splash

Sources dans `assets/` (`icon.png`, `icon-foreground.png`, `icon-background.png`,
`splash.png`, `splash-dark.png`), générées depuis `src/assets/centuria-logo.png`.
Régénérer après modification :

```bash
npx @capacitor/assets generate --iconBackgroundColor '#0B0B0D' \
  --splashBackgroundColor '#0B0B0D' --splashBackgroundColorDark '#0B0B0D'
```

## OAuth en natif

`oauthRedirectUrl()` (`src/lib/native.ts`) renvoie `app.centuria://auth/callback`
en natif et l'origine web sinon. Le retour est capté par `appUrlOpen` puis rejoué
dans la WebView pour établir la session.

À configurer côté fournisseurs (hors code) :
- Supabase Auth → *Redirect URLs* : ajouter `app.centuria://auth/callback`.
- Google Cloud Console : client OAuth iOS + Android (SHA-1 de la clé de signature).
- Apple : Sign in with Apple activé sur l'App ID `app.centuria`.

## Credentials encore manquants

| Élément | Où | Statut |
| --- | --- | --- |
| Team ID Apple + profil de provisioning | Xcode Signing | à fournir |
| Keystore Android (release) | Android Studio | à créer |
| Client OAuth Google iOS/Android + SHA-1 | Google Cloud | à créer |
| Sign in with Apple (App ID, Service ID, clé) | Apple Developer | à créer |
| Redirect `app.centuria://auth/callback` | Réglages Auth du backend | à ajouter |
| Clés RevenueCat iOS/Android + produits store | `VITE_REVENUECAT_IOS_KEY`, `VITE_REVENUECAT_ANDROID_KEY`, `VITE_PRODUCT_ID_STANDARD`, `VITE_PRODUCT_ID_STUDENT` | à fournir |
| `REVENUECAT_WEBHOOK_SECRET` | Secrets projet | à fournir |
