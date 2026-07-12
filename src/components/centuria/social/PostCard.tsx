import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Zap,
  Dumbbell,
  Utensils,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import { toggleHype, type FeedPost } from "@/lib/social";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";
import { voteOnPR } from "@/lib/prs.functions";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.round(diff / 60)}m`;
  if (diff < 86400) return `il y a ${Math.round(diff / 3600)}h`;
  return `il y a ${Math.round(diff / 86400)}j`;
}

export default function PostCard({ post }: { post: FeedPost }) {
  const [hyped, setHyped] = useState(post.hyped_by_me);
  const [count, setCount] = useState(post.hype_count);
  const grade = (post.author?.current_grade || "recruit") as Grade;

  const onHype = async () => {
    const next = !hyped;
    setHyped(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await toggleHype(post.id, hyped);
    } catch {
      setHyped(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
  };

  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      {/* Header */}
      <Link
        to="/profile/$userId"
        params={{ userId: post.user_id }}
        className="flex items-center gap-3"
      >
        <UserAvatar src={post.author?.avatar_url} pseudo={post.author?.pseudo} size={40} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{post.author?.pseudo}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider text-arena-gold">
              <GradeIcon grade={grade} size={10} /> {GRADE_LABELS[grade]?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-arena-sub">{timeAgo(post.created_at)}</span>
        </div>
      </Link>

      {/* Body per type */}
      {post.type === "pr" && <PRBody post={post} />}
      {post.type === "meal" && <MealBody post={post} />}
      {post.type === "workout" && <WorkoutBody post={post} />}
      {post.type === "level_up" && <LevelBody post={post} />}

      {/* Caption */}
      {post.caption && post.type !== "pr" && (
        <p className="mt-2 text-sm text-foreground/90">{post.caption}</p>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4 text-arena-sub">
        <button
          onClick={onHype}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            hyped ? "text-arena" : ""
          }`}
        >
          <Flame size={16} className={hyped ? "fill-arena text-arena" : ""} />
          <span className="font-bold">{count}</span>
        </button>
      </div>
    </div>
  );
}

function PRBadge({ status }: { status: NonNullable<FeedPost["pr"]>["status"] }) {
  if (status === "verified") {
    return (
      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-arena-green/10 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-arena-green">
        <ShieldCheck size={12} /> Vérifié par la communauté
      </div>
    );
  }
  if (status === "contested") {
    return (
      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-red-400">
        <ShieldAlert size={12} /> Contesté
      </div>
    );
  }
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-arena-gold/10 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-arena-gold">
      <ShieldQuestion size={12} /> PR à vérifier
    </div>
  );
}

function PRBody({ post }: { post: FeedPost }) {
  const pr = post.pr;
  const [status, setStatus] = useState(pr?.status ?? "pending");
  const [validCount, setValidCount] = useState(pr?.valid_count ?? 0);
  const [doubtCount, setDoubtCount] = useState(pr?.doubt_count ?? 0);
  const [myVote, setMyVote] = useState<"valid" | "doubt" | null>(pr?.my_vote ?? null);
  const [pending, setPending] = useState(false);

  const canVote = !!pr && !pr.is_own;

  const submitVote = async (next: "valid" | "doubt") => {
    if (!pr || pr.is_own || pending || myVote === next) return;
    setPending(true);
    // Optimistic
    const prev = { validCount, doubtCount, myVote, status };
    let v = validCount;
    let d = doubtCount;
    if (myVote === "valid") v = Math.max(0, v - 1);
    if (myVote === "doubt") d = Math.max(0, d - 1);
    if (next === "valid") v++;
    else d++;
    setValidCount(v);
    setDoubtCount(d);
    setMyVote(next);

    try {
      const res = await voteOnPR({ data: { prId: pr.id, vote: next } });
      setValidCount(res.valid_count);
      setDoubtCount(res.doubt_count);
      setStatus(res.status);
      setMyVote(res.my_vote);
      if (res.transitioned_to_verified) {
        toast.success("PR vérifié par la communauté !");
      }
    } catch (e: any) {
      setValidCount(prev.validCount);
      setDoubtCount(prev.doubtCount);
      setMyVote(prev.myVote);
      setStatus(prev.status);
      const msg =
        e instanceof Response ? await e.text().catch(() => "Vote impossible") : "Vote impossible";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="mt-3 rounded-xl bg-secondary p-3">
        <p className="text-xs font-bold text-arena-sub">
          {pr?.exercise?.toUpperCase() ?? "PR"}
        </p>
        <p className="mt-1 text-xl font-black text-foreground">
          {pr?.weight_kg ?? "—"} KG ·{" "}
          <span className="text-arena">
            {pr?.reps ?? 1} rep{(pr?.reps ?? 1) > 1 ? "s" : ""}
          </span>
        </p>
        <PRBadge status={status} />
      </div>

      {/* Vote buttons */}
      {pr && (
        <div className="mt-3">
          {pr.is_own ? (
            <p className="text-[11px] text-arena-muted">
              Ton PR — la communauté vote ({validCount} valide · {doubtCount} douteux).
            </p>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => submitVote("valid")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 ${
                  myVote === "valid"
                    ? "border-arena-green bg-arena-green/15 text-arena-green"
                    : "border-arena-border bg-arena-surface text-arena-sub hover:text-foreground"
                }`}
              >
                <ThumbsUp size={14} /> Valide · {validCount}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => submitVote("doubt")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 ${
                  myVote === "doubt"
                    ? "border-red-500 bg-red-500/15 text-red-400"
                    : "border-arena-border bg-arena-surface text-arena-sub hover:text-foreground"
                }`}
              >
                <ThumbsDown size={14} /> Douteux · {doubtCount}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MealBody({ post }: { post: FeedPost }) {
  return (
    <>
      {post.media_url && (
        <img
          src={post.media_url}
          alt={post.caption ?? "repas"}
          className="mt-3 h-56 w-full rounded-xl object-cover"
        />
      )}
      {post.macros && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(post.macros).map(([k, v]) => (
            <span key={k} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-arena-sub">
              <Utensils size={10} className="mr-1 inline" />
              {v}{k === "kcal" ? " kcal" : "g"} {k}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function WorkoutBody({ post }: { post: FeedPost }) {
  return (
    <>
      {post.media_url && (
        <img src={post.media_url} alt="" className="mt-3 h-56 w-full rounded-xl object-cover" />
      )}
      {post.muscle_groups && post.muscle_groups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.muscle_groups.map((m) => (
            <span key={m} className="rounded-full bg-arena/10 px-2.5 py-1 text-[10px] font-bold text-arena">
              <Dumbbell size={10} className="mr-1 inline" />
              {m}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function LevelBody({ post }: { post: FeedPost }) {
  return (
    <div className="mt-3 rounded-xl bg-gradient-to-br from-arena-gold/20 to-arena/10 p-4 text-center">
      <Zap size={24} className="mx-auto text-arena-gold" />
      <p className="mt-2 text-xs font-bold text-arena-gold">LEVEL UP</p>
      <p className="mt-1 text-lg font-black text-foreground">{post.caption}</p>
    </div>
  );
}
