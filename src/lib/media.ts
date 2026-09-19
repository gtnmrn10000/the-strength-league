import { supabase } from "@/integrations/supabase/client";

/**
 * Les médias des posts sont stockés dans des buckets privés :
 * - `pr-videos` pour les vidéos de record (chemin `<user>/<exo>/<ts>.mp4`)
 * - `post-media` pour les vidéos d'entraînement et photos publiées
 * `media_url` contient le chemin, pas une URL. On génère une URL signée à
 * l'affichage (et on la met en cache le temps de la session).
 */
const cache = new Map<string, string>();

export function bucketForPost(type: string): "pr-videos" | "post-media" {
  return type === "pr" ? "pr-videos" : "post-media";
}

export async function resolveMediaUrl(
  path: string | null,
  type: string,
): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const bucket = bucketForPost(type);
  const key = `${bucket}:${path}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;

  cache.set(key, data.signedUrl);
  return data.signedUrl;
}

/** Devine si un média est une vidéo à partir du type stocké et de l'extension. */
export function isVideoMedia(mediaType: string | null, path: string | null): boolean {
  if (mediaType === "video") return true;
  if (!path) return false;
  return /\.(mp4|mov|webm|m4v|quicktime)(\?|$)/i.test(path);
}
