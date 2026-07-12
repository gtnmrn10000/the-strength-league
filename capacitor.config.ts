import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.centuria',
  appName: 'Centuria',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    Camera: {
      // Descriptions used by @capacitor/camera when it triggers native prompts.
      // Actual Info.plist keys must also be set — see ios-permissions.md.
      permissions: ['camera', 'photos'],
    },
  },
};

export default config;
