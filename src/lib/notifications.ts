import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "follow"
  | "hype"
  | "comment"
  | "pr_vote"
  | "pr_verified"
  | "pr_contested"
  | "grade_up";

export interface AppNotification {
  id: string;
  type: string;
  actor_id: string | null;
  post_id: string | null;
  pr_id: string | null;
  meta: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  actor: { pseudo: string; avatar_url: string | null } | null;
}

export async function fetchNotifications(limit = 40): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, actor_id, post_id, pr_id, meta, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean) as string[])];
  const actors = new Map<string, { pseudo: string; avatar_url: string | null }>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("user_id, pseudo, avatar_url")
      .in("user_id", actorIds);
    (profiles ?? []).forEach((p) => {
      if (!p.user_id) return;
      actors.set(p.user_id, { pseudo: p.pseudo ?? "Athlète", avatar_url: p.avatar_url });
    });
  }

  return data.map((n) => ({
    id: n.id,
    type: n.type,
    actor_id: n.actor_id,
    post_id: n.post_id,
    pr_id: n.pr_id,
    meta: (n.meta ?? {}) as Record<string, unknown>,
    read_at: n.read_at,
    created_at: n.created_at,
    actor: n.actor_id ? actors.get(n.actor_id) ?? null : null,
  }));
}

export async function countUnread(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}

export async function markRead(id: string) {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
}

export function notificationLabel(n: AppNotification): string {
  const who = n.actor?.pseudo ?? "Un athlète";
  switch (n.type) {
    case "follow":
      return `${who} te suit maintenant.`;
    case "hype":
      return `${who} a hypé ton post.`;
    case "comment": {
      const preview = typeof n.meta['preview'] === "string" ? ` « ${n.meta['preview']} »` : "";
      return `${who} a commenté ton post.${preview}`;
    }
    case "pr_vote":
      return n.meta['vote'] === "doubt"
        ? `${who} a jugé ton PR douteux.`
        : `${who} a validé ton PR.`;
    case "pr_verified":
      return "Ton PR est vérifié par la communauté.";
    case "pr_contested":
      return "Ton PR est contesté par la communauté.";
    case "grade_up":
      return "Nouveau grade débloqué !";
    default:
      return "Nouvelle activité.";
  }
}
