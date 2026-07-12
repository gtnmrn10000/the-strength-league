# Permissions natives — iOS & Android

À ajouter APRÈS `npx cap add ios` / `npx cap add android`. Ces fichiers ne sont pas versionnés dans le repo web mais sont générés par Capacitor.

## iOS — `ios/App/App/Info.plist`

Ajouter à la fin, avant `</dict>` :

```xml
<key>NSCameraUsageDescription</key>
<string>Centuria a besoin de la caméra pour filmer vos PR (records personnels) et scanner vos aliments via reconnaissance photo.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Centuria a besoin d'accéder à votre galerie pour importer une vidéo de PR déjà filmée ou une photo d'aliment à analyser.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Centuria peut sauvegarder vos vidéos de PR dans votre galerie photo.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Centuria a besoin du micro pour enregistrer le son lors de la capture vidéo de vos PR (respiration, cliquetis des charges — utile pour la vérification communautaire).</string>
```

## Android — `android/app/src/main/AndroidManifest.xml`

Ajouter dans `<manifest>` :

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />
```

## Étapes complètes de mise en route Capacitor

```bash
bun run build
npx cap add ios       # crée le dossier ios/
npx cap add android   # crée le dossier android/
# (coller les entrées ci-dessus dans Info.plist / AndroidManifest.xml)
npx cap sync
npx cap open ios      # ouvre Xcode
npx cap open android  # ouvre Android Studio
```
