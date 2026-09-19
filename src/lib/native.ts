import { Capacitor } from "@capacitor/core";
import { handleBackButton } from "./backButton";
import { flushPendingSessions } from "./offlineSync";

export const isNative = () => Capacitor.isNativePlatform();

/** Schéma de deep link utilisé pour les retours OAuth natifs. */
export const NATIVE_SCHEME = "app.centuria";
export const NATIVE_AUTH_CALLBACK = `${NATIVE_SCHEME}://auth/callback`;

/** URL de redirection OAuth : deep link en natif, origine web sinon. */
export function oauthRedirectUrl() {
  if (isNative()) return NATIVE_AUTH_CALLBACK;
  return typeof window !== "undefined" ? window.location.origin : "";
}

let initialized = false;

/**
 * Initialise les plugins natifs (status bar, clavier, splash) et le routage
 * des deep links après OAuth. Sans effet sur le web.
 */
export async function initNativeShell(
  onAuthDeepLink?: (url: string) => void,
  onResume?: () => void,
) {
  if (initialized || !isNative()) return;
  initialized = true;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: false });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0B0B0D" });
    }
  } catch (e) {
    console.warn("[native] status bar unavailable", e);
  }

  try {
    const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setScroll({ isDisabled: false });
  } catch (e) {
    console.warn("[native] keyboard plugin unavailable", e);
  }

  try {
    const { App } = await import("@capacitor/app");
    await App.addListener("appUrlOpen", ({ url }) => {
      if (!url) return;
      if (url.startsWith(NATIVE_SCHEME)) {
        onAuthDeepLink?.(url);
        // Si le lien porte un code/tokens OAuth, on les rejoue côté web.
        const frag = url.split("#")[1];
        const query = url.split("?")[1]?.split("#")[0];
        if (frag || query) {
          const target = new URL(window.location.origin + "/");
          if (query) target.search = query;
          if (frag) target.hash = frag;
          window.location.replace(target.toString());
        }
      }
    });
  } catch (e) {
    console.warn("[native] app plugin unavailable", e);
  }

  try {
    const { App } = await import("@capacitor/app");

    // Bouton retour matériel Android : ferme les feuilles/dialogues ouverts
    // via le registre, sinon délègue à la logique d'onglets (onResume gère
    // aussi la reprise), sinon quitte l'app.
    App.addListener("backButton", () => {
      if (handleBackButton()) return;
      window.dispatchEvent(new CustomEvent("centuria:hardware-back"));
    });

    // Reprise au premier plan : on retente les séances en attente et on
    // déclenche un rafraîchissement léger de l'écran courant.
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void flushPendingSessions();
        onResume?.();
      }
    });
  } catch (e) {
    console.warn("[native] lifecycle listeners unavailable", e);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash absent : rien à faire */
  }
}
