import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type GoalType = Database["public"]["Enums"]["goal_type"];

export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  data: {
    pseudo: string;
    age?: number | null;
    taille?: number | null;
    poids?: number | null;
    goal?: GoalType | null;
    bio?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
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
        goal: data.goal ?? null,
        bio: data.bio ?? null,
        avatar_url: data.avatar_url ?? null,
        cover_url: data.cover_url ?? null,
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Failed to save profile: ${error.message}`);
  return { ok: true };
}

export async function getProfile(
  supabase: SupabaseClient,
  _userId: string
): Promise<ProfileRow | null> {
  // Use SECURITY DEFINER RPC so the caller can read their own sensitive fields
  // (age, poids, taille, sexe, niveau_activite, goal) which are no longer
  // exposed through the Data API's column-level SELECT grants.
  const { data, error } = await supabase.rpc("get_my_profile").maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return (data as ProfileRow | null) ?? null;
}
