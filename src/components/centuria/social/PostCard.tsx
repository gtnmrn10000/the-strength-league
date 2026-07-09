import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, ShieldCheck, Zap, Dumbbell, Utensils } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { toggleHype, type FeedPost } from "@/lib/social";
import { GRADE_LABELS, GRADE_EMOJIS, type Grade } from "@/lib/grades";

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
            <span className="text-[10px] font-black tracking-wider text-arena-gold">
              {GRADE_EMOJIS[grade]} {GRADE_LABELS[grade]?.toUpperCase()}
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

function PRBody({ post }: { post: FeedPost }) {
  const pr = post.pr;
  return (
    <>
      <div className="mt-3 rounded-xl bg-secondary p-3">
        <p className="text-xs font-bold text-arena-sub">
          {pr?.exercise?.toUpperCase() ?? "PR"}
        </p>
        <p className="mt-1 text-xl font-black text-foreground">
          {pr?.weight_kg ?? "—"} KG · <span className="text-arena">NEW PR</span>
        </p>
        {pr?.reps ? (
          <p className="mt-1 text-xs text-arena-sub">{pr.reps} rep{pr.reps > 1 ? "s" : ""}</p>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-arena-green">
        <ShieldCheck size={14} />
        <span className="font-bold">PR VÉRIFIÉ IA</span>
      </div>
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
