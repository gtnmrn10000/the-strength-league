import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { upsertProfile, getProfile } from "./profiles.server";

const saveProfileSchema = z.object({
  pseudo: z.string().min(3).max(24).regex(/^@?[a-zA-Z0-9_]+$/),
  age: z.number().min(13).max(99).nullable().optional(),
  taille: z.number().min(100).max(230).nullable().optional(),
  poids: z.number().min(30).max(250).nullable().optional(),
  goal: z.enum(["masse", "seche", "performance"]).nullable().optional(),
  bio: z.string().max(200).nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  cover_url: z.string().max(500).nullable().optional(),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    return upsertProfile(context.supabase, context.userId, {
      pseudo: data.pseudo,
      age: data.age ?? null,
      taille: data.taille ?? null,
      poids: data.poids ?? null,
      goal: data.goal ?? null,
      bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null,
      cover_url: data.cover_url ?? null,
    });
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return getProfile(context.supabase, context.userId);
  });
