import { Capacitor } from "@capacitor/core";

/** Version affichée dans Réglages > À propos et jointe aux rapports de bug. */
export const APP_VERSION = "1.0.0";

export type Platform = "ios" | "android" | "web";

/** Plateforme courante — utilise Capacitor quand l'app tourne en natif. */
export function getPlatform(): Platform {
  if (Capacitor.isNativePlatform()) {
    const p = Capacitor.getPlatform();
    if (p === "ios" || p === "android") return p;
  }
  return "web";
}
