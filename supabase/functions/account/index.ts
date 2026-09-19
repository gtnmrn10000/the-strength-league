import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser, adminClient } from "../_shared/authClient.ts";

const DELETE_CONFIRM_PHRASE = "SUPPRIMER";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { supabase, userId } = await requireUser(req);
    const body = await req.json().catch(() => ({}));

    if (body?.action === "export") {
      const grab = async (table: string, column = "user_id") => {
        const { data } = await supabase.from(table).select("*").eq(column, userId);
        return data ?? [];
      };
      const [profile, sessions, foods, weighIns, prs, posts, comments, customEx, favorites, coach] =
        await Promise.all([
          grab("profiles"), grab("workout_sessions"), grab("food_logs"), grab("weigh_ins"),
          grab("prs"), grab("posts"), grab("post_comments"), grab("custom_exercises"),
          grab("exercise_favorites"), grab("coach_conversations"),
        ]);
      return jsonResponse({
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
      });
    }

    if (body?.action === "delete") {
      const parsed = z.object({ confirm: z.string() }).safeParse(body);
      if (!parsed.success || parsed.data.confirm !== DELETE_CONFIRM_PHRASE) {
        return errorResponse("Confirmation invalide.", 400);
      }
      const admin = adminClient();

      await admin.from("community_foods").update({ created_by: null }).eq("created_by", userId);

      const purge = async (table: string, column: string) => {
        await admin.from(table).delete().eq(column, userId);
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

      for (const bucket of ["avatars", "pr-videos"]) {
        const { data: entries } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
        const paths: string[] = [];
        for (const entry of entries ?? []) {
          if (entry.id === null) {
            const { data: nested } = await admin.storage.from(bucket).list(`${userId}/${entry.name}`, { limit: 1000 });
            (nested ?? []).forEach((f) => paths.push(`${userId}/${entry.name}/${f.name}`));
          } else {
            paths.push(`${userId}/${entry.name}`);
          }
        }
        if (paths.length > 0) await admin.storage.from(bucket).remove(paths);
      }

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return errorResponse(error.message, 500);

      return jsonResponse({ ok: true });
    }

    return errorResponse("Unknown action", 400);
  } catch (e) {
    if (e instanceof Response) {
      const text = await e.text().catch(() => "Error");
      return errorResponse(text, e.status);
    }
    console.error("[account] error", e);
    return errorResponse(e instanceof Error ? e.message : "Erreur interne", 500);
  }
});
