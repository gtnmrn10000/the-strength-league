import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type LeagueType = Database["public"]["Enums"]["league_type"];
type GoalType = Database["public"]["Enums"]["goal_type"];

export async function upsertProfile(
  supabase: ReturnType<typeof supabaseAdmin extends never ? never : any>,
  userId: string,
  data: {
    pseudo: string;
    age?: number | null;
    taille?: number | null;
    poids?: number | null;
    league: LeagueType;
    goal?: GoalType | null;
  }
) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        pseudo: data.pseudo,
        age: data.age ?? null,
        taille: data.taille ?? null,
        poids: data.poids ?? null,
        league: data.league,
        goal: data.goal ?? null,
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Failed to save profile: ${error.message}`);
  return { ok: true };
}

export async function getProfile(
  supabase: any,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data;
}
