import { useEffect, useState } from "react";
import { Play, ImageOff } from "lucide-react";
import { resolveMediaUrl, isVideoMedia } from "@/lib/media";

interface Props {
  path: string | null;
  postType: string;
  mediaType: "image" | "video" | null;
  alt?: string;
  className?: string;
  /** Vignette : pas de contrôles, overlay play. */
  thumb?: boolean;
}

export function PostMedia({ path, postType, mediaType, alt, className, thumb }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const video = isVideoMedia(mediaType, path);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    resolveMediaUrl(path, postType)
      .then((u) => {
        if (!alive) return;
        if (u) setUrl(u);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [path, postType]);

  if (!path) return null;

  const base = className ?? "mt-3 w-full rounded-xl bg-black object-cover";

  if (failed) {
    return (
      <div className={`${base} flex flex-col items-center justify-center gap-1 bg-arena-surface`}>
        <ImageOff size={18} className="text-arena-muted" />
        {!thumb && (
          <span className="text-[11px] text-arena-muted">
            {video ? "Vidéo indisponible" : "Image indisponible"}
          </span>
        )}
      </div>
    );
  }

  if (!url) {
    return <div className={`${base} animate-pulse bg-arena-surface`} />;
  }

  if (video) {
    if (thumb) {
      return (
        <div className={`relative ${base}`}>
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
              <Play size={14} className="ml-0.5 text-white" fill="currentColor" />
            </span>
          </span>
        </div>
      );
    }
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className={base}
        onPlay={(e) => {
          const current = e.currentTarget;
          document.querySelectorAll("video").forEach((v) => {
            if (v !== current && !v.paused) v.pause();
          });
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? ""}
      className={base}
      onError={() => setFailed(true)}
    />
  );
}
