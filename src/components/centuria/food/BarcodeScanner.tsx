import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, Loader2 } from "lucide-react";

export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const back = devices.find((d) => /back|arrière|rear|environment/i.test(d.label)) ?? devices[0];
        if (!back) {
          setError("Aucune caméra détectée.");
          setStarting(false);
          return;
        }
        const controls = await reader.decodeFromVideoDevice(back.deviceId, videoRef.current!, (result) => {
          if (result && !cancelled) {
            const code = result.getText();
            if (code && /^\d{6,}$/.test(code)) {
              controls.stop();
              onDetected(code);
            }
          }
        });
        controlsRef.current = controls;
        setStarting(false);
      } catch (e: any) {
        setError(e?.message || "Impossible d'accéder à la caméra.");
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Camera size={18} />
          <span className="text-sm font-bold tracking-wide">SCANNER UN PRODUIT</span>
        </div>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2 active:scale-90">
          <X size={18} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-72 rounded-2xl border-2 border-arena shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
        </div>
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-white">
            <Loader2 className="animate-spin" size={18} /> Démarrage caméra…
          </div>
        )}
        {error && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl bg-red-500/90 p-4 text-center text-sm font-bold text-white">
            {error}
          </div>
        )}
      </div>

      <p className="px-6 py-4 text-center text-xs text-white/70">
        Alignez le code-barres dans le cadre. Reconnaissance automatique.
      </p>
    </div>
  );
}
