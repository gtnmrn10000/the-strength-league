import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Phrase exacte attendue en 2e confirmation avant suppression définitive. */
export const DELETE_CONFIRM_PHRASE = "SUPPRIMER";

/* ───────────────────────── Export des données ───────────────────────── */

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const grab = async (table: string, column = "user_id") => {
      const { data } = await supabase.from(table as never).select("*").eq(column, userId);
      return data ?? [];
    };

    const [profile, sessions, foods, weighIns, prs, posts, comments, customEx, favorites, coach] =
      await Promise.all([
        grab("profiles"),
        grab("workout_sessions"),
        grab("food_logs"),
        grab("weigh_ins"),
        grab("prs"),
        grab("posts"),
        grab("post_comments"),
        grab("custom_exercises"),
        grab("exercise_favorites"),
        grab("coach_conversations"),
      ]);

    return {
      export_version: 1,
      generated_at: new Date().toISOString(),
      user_id: userId,
      profil: profile,
      seances: sessions,
      nutrition: foods,
      pesees: weighIns,
      records_pr: prs,
      posts,
      commentaires: comments,
      exercices_personnalises: customEx,
      favoris: favorites,
      conversations_coach: coach,
    };
  });

/* ─────────────────────── Suppression de compte ─────────────────────── */

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { confirm: string }) => {
    if (!input || input.confirm !== DELETE_CONFIRM_PHRASE) {
      throw new Error("Confirmation invalide.");
    }
    return input;
  })
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Anonymisation de ce qui reste utile à la communauté (base alimentaire
    //    partagée, signalements dont l'utilisateur est la cible).
    await supabaseAdmin
      .from("community_foods")
      .update({ created_by: null })
      .eq("created_by", userId);

    // 2) Suppression des données strictement personnelles / sociales.
    const purge = async (table: string, column: string) => {
      await supabaseAdmin.from(table as never).delete().eq(column, userId);
    };

    await purge("notifications", "user_id");
    await purge("notifications", "actor_id");
    await purge("content_reports", "reporter_id");
    await purge("user_blocks", "blocker_id");
    await purge("user_blocks", "blocked_id");
    await purge("post_comments", "user_id");
    await purge("post_hypes", "user_id");
    await purge("pr_votes", "user_id");
    await purge("follows", "follower_id");
    await purge("follows", "following_id");
    await purge("posts", "user_id");
    await purge("prs", "user_id");
    await purge("workout_sessions", "user_id");
    await purge("food_logs", "user_id");
    await purge("weigh_ins", "user_id");
    await purge("custom_exercises", "user_id");
    await purge("exercise_favorites", "user_id");
    await purge("coach_conversations", "user_id");
    await purge("profiles", "user_id");

    // 3) Fichiers (avatars + vidéos de PR) rangés sous <user_id>/…
    for (const bucket of ["avatars", "pr-videos"]) {
      const { data: entries } = await supabaseAdmin.storage.from(bucket).list(userId, {
        limit: 1000,
      });
      const paths: string[] = [];
      for (const entry of entries ?? []) {
        if (entry.id === null) {
          const { data: nested } = await supabaseAdmin.storage
            .from(bucket)
            .list(`${userId}/${entry.name}`, { limit: 1000 });
          (nested ?? []).forEach((f) => paths.push(`${userId}/${entry.name}/${f.name}`));
        } else {
          paths.push(`${userId}/${entry.name}`);
        }
      }
      if (paths.length > 0) await supabaseAdmin.storage.from(bucket).remove(paths);
    }

    // 4) Compte d'authentification.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
