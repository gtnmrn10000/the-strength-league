// Handles PR submission + community verification voting.
import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser, adminClient } from "../_shared/authClient.ts";
import { GRADES, gradeForXp, type Grade } from "../_shared/grades.ts";

const submitSchema = z.object({
  action: z.literal("submit"),
  exercise: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "identifiant d'exercice invalide"),
  exercise_name: z.string().trim().min(2).max(80),
  weight_kg: z.number().min(1).max(600),
  reps: z.number().int().min(1).max(30),
  video_url: z.string().min(1).max(500),
});

const voteSchema = z.object({
  action: z.literal("vote"),
  prId: z.string().uuid(),
  vote: z.enum(["valid", "doubt"]),
});

const VERIFY_NET_VOTES = 5;
const CONTEST_MIN_TOTAL = 5;
const CONTEST_DOUBT_RATIO = 0.5;
const XP_COMMUNITY_PR = 300;

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { supabase, userId } = await requireUser(req);
    const body = await req.json().catch(() => ({}));

    if (body?.action === "submit") {
      const data = submitSchema.parse(body);
      const { data: pr, error } = await supabase
        .from("prs")
        .insert({
          user_id: userId,
          exercise: data.exercise,
          exercise_id: data.exercise,
          exercise_name: data.exercise_name,
          weight_kg: data.weight_kg,
          reps: data.reps,
          video_url: data.video_url,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) return errorResponse(`Failed to insert PR: ${error.message}`, 500);
      return jsonResponse(pr);
    }

    if (body?.action === "vote") {
      const data = voteSchema.parse(body);

      const { data: pr, error: prErr } = await supabase
        .from("prs")
        .select("id, user_id, status")
        .eq("id", data.prId)
        .maybeSingle();
      if (prErr) return errorResponse("PR introuvable", 500);
      if (!pr) return errorResponse("PR introuvable", 404);
      if (pr.user_id === userId) return errorResponse("Impossible de voter sur son propre PR", 403);

      const { error: upErr } = await supabase
        .from("pr_votes")
        .upsert({ pr_id: data.prId, user_id: userId, vote: data.vote }, { onConflict: "pr_id,user_id" });
      if (upErr) return errorResponse(upErr.message, 500);

      const { data: votes, error: vErr } = await supabase.from("pr_votes").select("vote").eq("pr_id", data.prId);
      if (vErr) return errorResponse(vErr.message, 500);

      let valid_count = 0;
      let doubt_count = 0;
      for (const v of votes ?? []) {
        if (v.vote === "valid") valid_count++;
        else if (v.vote === "doubt") doubt_count++;
      }
      const total = valid_count + doubt_count;
      const net = valid_count - doubt_count;

      let nextStatus = pr.status as string;
      let transitioned_to_verified = false;
      if (pr.status !== "verified") {
        if (net >= VERIFY_NET_VOTES) {
          nextStatus = "verified";
          transitioned_to_verified = true;
        } else if (total >= CONTEST_MIN_TOTAL && doubt_count / total > CONTEST_DOUBT_RATIO) {
          nextStatus = "contested";
        } else {
          nextStatus = "pending";
        }
      }

      if (nextStatus !== pr.status) {
        const { error: uErr } = await supabase.from("prs").update({ status: nextStatus }).eq("id", data.prId);
        if (uErr) return errorResponse(uErr.message, 500);

        if (transitioned_to_verified) {
          // Award XP + recompute grade for the PR owner via service-role
          // (profiles.update RLS only allows the row owner; the voter isn't the owner).
          const admin = adminClient();
          const awardDay = new Date().toISOString().slice(0, 10);
          const { data: isNewXp, error: xpErr } = await admin.rpc("record_xp_event", {
            _user_id: pr.user_id,
            _kind: "community_pr_verified",
            _amount: XP_COMMUNITY_PR,
            _day: awardDay,
            _ref_id: pr.id,
          });
          if (xpErr) {
            console.error("[prs] xp_events insert error", xpErr);
          }
          if (isNewXp) {
            await admin
              .from("profiles")
              .update({ last_pr_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq("user_id", pr.user_id);
          }
        }
      }

      return jsonResponse({
        status: nextStatus,
        valid_count,
        doubt_count,
        my_vote: data.vote,
        transitioned_to_verified,
      });
    }

    return errorResponse("Unknown action", 400);
  } catch (e) {
    if (e instanceof Response) {
      const text = await e.text().catch(() => "Error");
      return errorResponse(text, e.status);
    }
    console.error("[prs] error", e);
    return errorResponse(e instanceof Error ? e.message : "Erreur interne", 500);
  }
});
