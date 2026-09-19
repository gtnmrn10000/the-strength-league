import type { CapacitorConfig } from '@capacitor/cli';

/**
 * L'app est rendue côté serveur (TanStack Start + server functions) : le build
 * client ne contient pas d'index.html autonome. Le shell natif charge donc
 * l'app hébergée. `CAP_SERVER_URL` permet de pointer vers le préview ou un
 * tunnel local pendant le développement.
 */
const serverUrl = process.env['CAP_SERVER_URL'] || 'https://centuriapp.lovable.app';

const config: CapacitorConfig = {
  appId: 'app.centuria',
  appName: 'Centuria',
  webDir: 'dist/client',
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    // Domaines autorisés à rester dans la WebView (OAuth Google/Apple + Supabase)
    allowNavigation: [
      'centuriapp.lovable.app',
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
