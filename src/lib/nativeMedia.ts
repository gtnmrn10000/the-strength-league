import { Capacitor } from "@capacitor/core";

/**
 * Prend une photo — Capacitor Camera si natif, sinon input file web.
 * Retourne un File prêt à uploader ou passer à FileReader.
 */
export async function capturePhoto(): Promise<File | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt, // laisse choisir Caméra ou Galerie
        promptLabelHeader: "Photo",
        promptLabelPhoto: "Depuis la galerie",
        promptLabelPicture: "Prendre une photo",
      });
      if (!photo.webPath) return null;
      const blob = await fetch(photo.webPath).then((r) => r.blob());
      const ext = photo.format || "jpg";
      return new File([blob], `photo.${ext}`, { type: blob.type || `image/${ext}` });
    } catch (e) {
      console.warn("[nativeMedia] Capacitor camera failed, fallback web", e);
    }
  }
  return pickFileWeb("image/*", true);
}

/**
 * Capture ou choisit une vidéo. Pas de plugin Capacitor officiel pour la vidéo —
 * on utilise le WebView natif via input[type=file] qui déclenche la caméra
 * système sur iOS/Android quand `capture` est défini. Fallback web propre.
 */
export async function captureVideo(fromCamera = true): Promise<File | null> {
  return pickFileWeb("video/*", fromCamera);
}

function pickFileWeb(accept: string, capture: boolean): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    if (capture) input.setAttribute("capture", "environment");
    input.style.display = "none";
    input.onchange = () => {
      const f = input.files?.[0] ?? null;
      resolve(f);
      input.remove();
    };
    input.oncancel = () => {
      resolve(null);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  });
}
