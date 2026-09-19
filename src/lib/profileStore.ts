import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type GoalType = Database["public"]["Enums"]["goal_type"];

/** Lit le profil du user connecté via le RPC SECURITY DEFINER (owner-only). */
export async function fetchMyProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabase.rpc("get_my_profile").maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProfileRow | null) ?? null;
}

export interface ProfileInput {
  pseudo: string;
  age?: number | null;
  taille?: number | null;
  poids?: number | null;
  goal?: GoalType | null;
}

/** Crée / met à jour le profil du user connecté. */
export async function saveMyProfile(input: ProfileInput): Promise<void> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Session expirée. Reconnecte-toi.");

  const existing = await fetchMyProfile();
  const payload = {
    user_id: userData.user.id,
    pseudo: input.pseudo,
    age: input.age ?? null,
    taille: input.taille ?? null,
    poids: input.poids ?? null,
    goal: input.goal ?? null,
    onboarded: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("profiles").update(payload).eq("user_id", userData.user.id)
    : await supabase.from("profiles").insert([payload]);

  if (error) throw new Error(error.message);
}
