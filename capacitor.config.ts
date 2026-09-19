import type { CapacitorConfig } from '@capacitor/cli';

/**
 * L'app est EMBARQUÉE dans le binaire : `bun run build:native` produit un SPA
 * autonome dans `dist/client` (index.html + assets), chargé localement par la
 * WebView. Seules les API distantes (Supabase, Edge Functions) sortent du
 * téléphone.
 *
 * `CAP_SERVER_URL` sert uniquement au développement (live reload sur un
 * tunnel ou le préview) et n'est jamais utilisé pour un build de production.
 */
const devServerUrl = process.env['CAP_SERVER_URL'];

const config: CapacitorConfig = {
  appId: 'app.centuria',
  appName: 'Centuria',
  webDir: 'dist/client',
  server: {
    ...(devServerUrl ? { url: devServerUrl } : {}),
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    // Domaines autorisés à rester dans la WebView (OAuth Google/Apple + Supabase)
    allowNavigation: [
      '*.lovable.app',
      '*.supabase.co',
      'accounts.google.com',
      'appleid.apple.com',
    ],
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    Camera: {
      // Les textes de permission réels doivent être dans Info.plist / Manifest
      // (voir docs/mobile-build.md).
      permissions: ['camera', 'photos'],
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0B0B0D',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0B0D',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
