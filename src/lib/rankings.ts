import { supabase } from "@/integrations/supabase/client";
import type { Grade } from "@/lib/grades";

export type XpRanks = {
  global_rank: number;
  global_participants: number;
  grade_rank: number;
  grade_participants: number;
  current_grade: string;
  xp: number;
};

export type XpLeaderboardRow = {
  user_id: string;
  pseudo: string;
  avatar_url: string | null;
  current_grade: string;
  xp: number;
  global_rank: number;
  grade_rank: number;
};

export async function fetchMyXpRanks(): Promise<XpRanks | null> {
  const { data, error } = await supabase.rpc("get_my_xp_ranks").maybeSingle();
  if (error) throw error;
  return data as XpRanks | null;
}

export async function fetchUserXpRanks(userId: string): Promise<XpRanks | null> {
  const { data, error } = await supabase.rpc("get_user_xp_ranks", { _user_id: userId }).maybeSingle();
  if (error) throw error;
  return data as XpRanks | null;
}

export async function fetchXpLeaderboard(input: { grade?: Grade; limit?: number; offset?: number } = {}) {
  const { data, error } = await supabase.rpc("get_xp_leaderboard", {
    _grade: input.grade ?? undefined,
    _limit: input.limit ?? 30,
    _offset: input.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as XpLeaderboardRow[];
}