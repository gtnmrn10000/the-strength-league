import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { insertPR } from "@/server/prs.server";
import { updateProfileAfterPR } from "@/server/grades.server";

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
    // Insertion of the row also auto-creates a public "pr" post via
    // DB trigger. PR starts in "pending" — it's now up to the community
    // to validate it (see voteOnPR). Grade/XP unlock only when it
    // transitions to "verified".
    return insertPR(context.supabase, context.userId, data);
  });

// Community verification thresholds
export const VERIFY_NET_VOTES = 5; // (valid - doubt) >= this → verified
export const CONTEST_MIN_TOTAL = 5; // at least this many votes...
export const CONTEST_DOUBT_RATIO = 0.5; // ...and >50% doubt → contested

const voteSchema = z.object({
  prId: z.string().uuid(),
  vote: z.enum(["valid", "doubt"]),
});

export type PRVoteResult = {
  status: "pending" | "verified" | "contested" | "rejected" | "suspect";
  valid_count: number;
  doubt_count: number;
  my_vote: "valid" | "doubt" | null;
  transitioned_to_verified: boolean;
};

export const voteOnPR = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => voteSchema.parse(d))
  .handler(async ({ data, context }): Promise<PRVoteResult> => {
    const { supabase, userId } = context;

    // Load PR (must exist, not owned by voter)
    const { data: pr, error: prErr } = await supabase
      .from("prs")
      .select("id, user_id, status")
      .eq("id", data.prId)
      .maybeSingle();
    if (prErr) throw new Response("PR introuvable", { status: 500 });
    if (!pr) throw new Response("PR introuvable", { status: 404 });
    if (pr.user_id === userId) {
      throw new Response("Impossible de voter sur son propre PR", { status: 403 });
    }

    // Upsert the vote (one row per user per PR — allows changing vote)
    const { error: upErr } = await supabase
      .from("pr_votes")
      .upsert(
        { pr_id: data.prId, user_id: userId, vote: data.vote },
        { onConflict: "pr_id,user_id" }
      );
    if (upErr) throw new Response(upErr.message, { status: 500 });

    // Recount
    const { data: votes, error: vErr } = await supabase
      .from("pr_votes")
      .select("vote")
      .eq("pr_id", data.prId);
    if (vErr) throw new Response(vErr.message, { status: 500 });

    let valid_count = 0;
    let doubt_count = 0;
    for (const v of votes ?? []) {
      if (v.vote === "valid") valid_count++;
      else if (v.vote === "doubt") doubt_count++;
    }
    const total = valid_count + doubt_count;
    const net = valid_count - doubt_count;

    // Decide new status. Once verified we don't un-verify (grade stays);
    // but a wave of doubts can still flip a still-pending PR to contested.
    let nextStatus = pr.status as PRVoteResult["status"];
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
      const { error: uErr } = await supabase
        .from("prs")
        .update({ status: nextStatus })
        .eq("id", data.prId);
      if (uErr) throw new Response(uErr.message, { status: 500 });

      // On first transition to verified, award XP + recompute grade
      // for the PR's owner (acting as a normal signed-in user; the
      // grade-update helper only touches profiles rows the RLS permits,
      // and profiles.update is scoped to the row's user_id — so we need
      // an authenticated client for the PR owner. Use a server-side
      // publishable client via supabaseAdmin only for this specific
      // maintenance write.)
      if (transitioned_to_verified) {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        await updateProfileAfterPR(supabaseAdmin, pr.user_id);
      }
    }

    return {
      status: nextStatus,
      valid_count,
      doubt_count,
      my_vote: data.vote,
      transitioned_to_verified,
    };
  });

const prIdSchema = z.object({ prId: z.string().uuid() });

export const getPRVoteState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => prIdSchema.parse(d))
  .handler(async ({ data, context }): Promise<PRVoteResult> => {
    const { supabase, userId } = context;
    const [{ data: pr }, { data: votes }, { data: mine }] = await Promise.all([
      supabase.from("prs").select("status").eq("id", data.prId).maybeSingle(),
      supabase.from("pr_votes").select("vote").eq("pr_id", data.prId),
      supabase
        .from("pr_votes")
        .select("vote")
        .eq("pr_id", data.prId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    let valid_count = 0;
    let doubt_count = 0;
    for (const v of votes ?? []) {
      if (v.vote === "valid") valid_count++;
      else if (v.vote === "doubt") doubt_count++;
    }
    return {
      status: (pr?.status ?? "pending") as PRVoteResult["status"],
      valid_count,
      doubt_count,
      my_vote: (mine?.vote as "valid" | "doubt" | undefined) ?? null,
      transitioned_to_verified: false,
    };
  });
