import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { insertPR, verifyPR } from "./prs.server";
import { updateProfileAfterPR } from "./grades.server";

const submitPRSchema = z.object({
  exercise: z.enum(["squat", "bench", "deadlift"]),
  weight_kg: z.number().min(20).max(500),
  reps: z.number().min(1).max(5),
  video_url: z.string().min(1).max(500),
});

export const submitPR = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitPRSchema.parse(data))
  .handler(async ({ data, context }) => {
    return insertPR(context.supabase, context.userId, data);
  });

export const mockVerifyPR = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ prId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    // 1. Mark PR as verified
    await verifyPR(context.supabase, data.prId);

    // 2. Recalculate grade + add XP
    const result = await updateProfileAfterPR(context.supabase, context.userId);

    return result;
  });
