import { supabase } from "@/integrations/supabase/client";

export type ReportTarget = "post" | "profile" | "comment";

export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam ou publicité" },
  { value: "harassment", label: "Harcèlement ou haine" },
  { value: "nudity", label: "Contenu sexuel ou choquant" },
  { value: "cheating", label: "PR truqué / triche" },
  { value: "danger", label: "Contenu dangereux" },
  { value: "other", label: "Autre" },
];

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi.");
  return user;
}

/* ── Blocages ── */

/** Ids des utilisateurs bloqués par moi ou qui m'ont bloqué. */
export async function fetchBlockedIds(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id, blocked_id");
  if (error) return new Set();
  const ids = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.blocker_id === user.id) ids.add(row.blocked_id);
    if (row.blocked_id === user.id) ids.add(row.blocker_id);
  });
  return ids;
}

export async function isBlockedByMe(targetId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function blockUser(targetId: string) {
  const user = await requireUser();
  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: user.id, blocked_id: targetId });
  if (error && error.code !== "23505") throw error;
  // Couper les liens sociaux existants dans les deux sens.
  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);
  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", targetId)
    .eq("following_id", user.id);
}

export async function unblockUser(targetId: string) {
  const user = await requireUser();
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);
  if (error) throw error;
}

export async function fetchBlockedProfiles() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  if (error || !data || data.length === 0) return [];
  const ids = data.map((r) => r.blocked_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, pseudo, avatar_url, current_grade")
    .in("user_id", ids);
  return (profiles ?? []) as {
    user_id: string;
    pseudo: string;
    avatar_url: string | null;
    current_grade: string;
  }[];
}

/* ── Signalements ── */

export async function reportContent(input: {
  targetType: ReportTarget;
  targetId: string;
  targetUserId?: string | null;
  reason: string;
  details?: string | null;
}) {
  const user = await requireUser();
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    target_user_id: input.targetUserId ?? null,
    reason: input.reason,
    details: input.details?.trim() || null,
    status: "open",
  });
  if (error) throw error;
}
