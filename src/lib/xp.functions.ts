import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { awardWorkoutXpServer, type Grade } from "@/server/grades.server";

const awardWorkoutXpSchema = z.object({
  sessionId: z.string().uuid(),
});

export type AwardWorkoutXpResult = {
  xp: number;
  grade: Grade;
  leveledUp: boolean;
  previousGrade: Grade;
  gained: number;
};

/**
 * À appeler à la fin d'une séance (quand `completed_at` est renseigné).
 * Idempotente par jour côté serveur (table `xp_events`) : rappeler cette
 * fonction plusieurs fois pour la même séance/le même jour ne recrédite
 * pas d'XP en double.
 *
 * Câblage attendu : appeler `awardWorkoutXp({ data: { sessionId } })`
 * juste après la mise à jour de `workout_sessions.completed_at` dans le
 * flux de fin de séance (WorkoutLogger/Training — hors périmètre de ce
 * chantier). Utiliser le `leveledUp` retourné pour déclencher
 * `LevelUpOverlay`.
 */
export const awardWorkoutXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => awardWorkoutXpSchema.parse(data))
  .handler(async ({ data, context }): Promise<AwardWorkoutXpResult> => {
    const { supabase, userId } = context;

    const { data: session, error } = await supabase
      .from("workout_sessions")
      .select("id, user_id, completed_at, exercises")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Response(error.message, { status: 500 });
    if (!session) throw new Response("Séance introuvable", { status: 404 });
    if (!session.completed_at) {
      throw new Response("La séance n'est pas terminée", { status: 400 });
    }

    return awardWorkoutXpServer(supabase, userId, {
      completed_at: session.completed_at,
      exercises: session.exercises,
    });
  });
