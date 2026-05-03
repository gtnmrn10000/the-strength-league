import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { upsertProfile, getProfile } from "./profiles.server";

const saveProfileSchema = z.object({
  pseudo: z.string().min(3).max(24).regex(/^@?[a-zA-Z0-9_]+$/),
  age: z.number().min(13).max(99).nullable().optional(),
  taille: z.number().min(100).max(230).nullable().optional(),
  poids: z.number().min(30).max(250).nullable().optional(),
  league: z.enum(["naturelle", "olympien"]),
  goal: z.enum(["masse", "seche", "performance"]).nullable().optional(),
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
      league: data.league,
      goal: data.goal ?? null,
    });
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return getProfile(context.supabase, context.userId);
  });
