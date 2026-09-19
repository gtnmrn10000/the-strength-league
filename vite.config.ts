// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Build natif (Capacitor) : `CAP_BUILD=1 vite build` produit un SPA autonome
// dans dist/client (index.html + assets), embarqué dans le binaire iOS/Android.
// Le build web par défaut reste inchangé (SSR + Nitro).
const nativeBuild = process.env["CAP_BUILD"] === "1";

export default defineConfig(
  nativeBuild
    ? {
        tanstackStart: { spa: { enabled: true } },
        nitro: false,
      }
    : {}
);
