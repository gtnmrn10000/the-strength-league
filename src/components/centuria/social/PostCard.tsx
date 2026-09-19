import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { PostMedia } from "./PostMedia";
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Zap,
  Dumbbell,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Ban,
  Repeat2,
  Bookmark,
  Share2,
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import CommentsSheet from "./CommentsSheet";
import ReportSheet from "./ReportSheet";
import { toggleHype, toggleSave, repost, undoRepost, type FeedPost } from "@/lib/social";
import { blockUser } from "@/lib/moderation";
import { friendlyError } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeEmblem } from "../grades/GradeEmblem";
import { voteOnPR } from "@/lib/api";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.round(diff / 3600)} h`;
  return `il y a ${Math.round(diff / 86400)} j`;
}

const TYPE_HINT: Record<string, string> = {
  pr: "Record officiel",
  workout: "Entraînement",
  meal: "Repas",
  level_up: "Nouveau grade",
};

export default function PostCard({ post }: { post: FeedPost }) {
  const [hyped, setHyped] = useState(post.hyped_by_me);
  const [count, setCount] = useState(post.hype_count);
  const [comments, setComments] = useState(post.comment_count ?? 0);
  const [saved, setSaved] = useState(post.saved_by_me);
  const [myRepostId, setMyRepostId] = useState<string | null>(post.my_repost_id);
  const [repostCount, setRepostCount] = useState(post.repost_count ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [busyRepost, setBusyRepost] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const grade = (post.author?.current_grade || "recruit") as Grade;

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setMyId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onHype = async () => {
    const next = !hyped;
    setHyped(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await toggleHype(post.id, hyped);
    } catch (e) {
      setHyped(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast.error(friendlyError(e, "Action impossible."));
    }
  };

  const onSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, saved);
      if (next) track("post_saved", { type: post.type });
    } catch (e) {
      setSaved(!next);
      toast.error(friendlyError(e, "Enregistrement impossible."));
    }
  };

  const onRepost = async () => {
    if (busyRepost) return;
    setBusyRepost(true);
    const wasReposted = !!myRepostId;
    try {
      if (wasReposted) {
        const id = myRepostId!;
        setMyRepostId(null);
        setRepostCount((c) => Math.max(0, c - 1));
        await undoRepost(id);
        toast.success("Republication retirée.");
      } else {
        setRepostCount((c) => c + 1);
        const id = await repost(post.id);
        setMyRepostId(id);
        toast.success("Republié sur ton profil.");
        track("post_reposted", { type: post.type });
      }
    } catch (e) {
      setMyRepostId(wasReposted ? myRepostId : null);
      setRepostCount(post.repost_count ?? 0);
      toast.error(friendlyError(e, "Republication impossible."));
    } finally {
      setBusyRepost(false);
    }
  };

  const onShare = async () => {
    const url = `${window.location.origin}/profile/${post.user_id}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "CENTURIA", text: post.caption ?? `Publication de ${post.author?.pseudo}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié.");
      } catch {
        toast.error("Partage indisponible.");
      }
    }
  };

  const onBlock = async () => {
    setMenuOpen(false);
    try {
      await blockUser(post.user_id);
      setHidden(true);
      toast.success("Utilisateur bloqué.");
    } catch (e) {
      toast.error(friendlyError(e, "Blocage impossible."));
    }
  };

  const isMine = myId !== null && myId === post.user_id;

  if (hidden) return null;

  return (
    <div className="border-b border-arena-border pb-4">
      {post.reposter && (
        <div className="flex items-center gap-2 px-1 pb-2 text-[11px] text-arena-sub">
          <Repeat2 size={13} />
          <Link to="/profile/$userId" params={{ userId: post.reposter.user_id }} className="font-semibold">
            {post.reposter.pseudo}
          </Link>
          <span>a republié</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/profile/$userId"
          params={{ userId: post.user_id }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <UserAvatar src={post.author?.avatar_url} pseudo={post.author?.pseudo} size={38} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{post.author?.pseudo}</span>
              <GradeEmblem grade={grade} size={18} />
              <span className="shrink-0 text-[10px] text-arena-sub">{GRADE_LABELS[grade]}</span>
            </div>
            <span className="text-[11px] text-arena-sub">
              {TYPE_HINT[post.type] ?? "Publication"} · {timeAgo(post.reposter?.created_at ?? post.created_at)}
            </span>
          </div>
        </Link>

        {!isMine && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Options de la publication"
              className="flex h-9 w-9 items-center justify-center rounded-full text-arena-muted"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <>
                <button
                  aria-label="Fermer le menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-arena-border bg-arena-surface shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-3 text-left text-xs font-semibold text-foreground"
                  >
                    <Flag size={14} /> Signaler
                  </button>
                  <button
                    onClick={onBlock}
                    className="flex w-full items-center gap-2 border-t border-arena-border px-3 py-3 text-left text-xs font-semibold text-red-400"
                  >
                    <Ban size={14} /> Bloquer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body per type */}
      {post.type === "pr" && <PRBody post={post} />}
      {post.type === "meal" && <MealBody post={post} />}
      {post.type === "workout" && <WorkoutBody post={post} />}
      {post.type === "level_up" && <LevelBody post={post} />}

      {/* Caption */}
      {post.caption && post.type !== "pr" && (
        <p className="mt-2 text-sm leading-snug text-foreground/90">{post.caption}</p>
      )}

      {/* Barre d'actions */}
      <div className="mt-3 flex items-center gap-1 text-arena-sub">
        <ActionButton
          label={hyped ? "Retirer le hype" : "Hype"}
          onClick={onHype}
          active={hyped}
          count={count}
          icon={<Flame size={19} className={hyped ? "fill-arena text-arena" : ""} />}
        />
        <ActionButton
          label="Commenter"
          onClick={() => setCommentsOpen(true)}
          count={comments}
          icon={<MessageCircle size={19} />}
        />
        <ActionButton
          label={myRepostId ? "Annuler la republication" : "Republier"}
          onClick={onRepost}
          active={!!myRepostId}
          count={repostCount}
          icon={<Repeat2 size={19} className={myRepostId ? "text-arena-green" : ""} />}
        />
        <ActionButton label="Partager" onClick={onShare} icon={<Share2 size={18} />} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? "Retirer des enregistrements" : "Enregistrer"}
          aria-pressed={saved}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95"
        >
          <Bookmark size={19} className={saved ? "fill-foreground text-foreground" : ""} />
        </button>
      </div>

      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post.id}
        onCountChange={setComments}
      />
      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={post.id}
        targetUserId={post.user_id}
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  count,
  active,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-10 min-w-10 items-center gap-1.5 rounded-full px-2 text-xs transition-transform active:scale-95 ${
        active ? "text-foreground" : ""
      }`}
    >
      {icon}
      {typeof count === "number" && count > 0 && <span className="font-semibold">{count}</span>}
    </button>
  );
}

function PRBadge({ status }: { status: NonNullable<FeedPost["pr"]>["status"] }) {
  if (status === "verified") {
    return (
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-arena-green">
        <ShieldCheck size={13} /> Vérifié par la communauté
      </div>
    );
  }
  if (status === "contested") {
    return (
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
        <ShieldAlert size={13} /> Contesté — à revoir
      </div>
    );
  }
  return (
    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-arena-gold">
      <ShieldQuestion size={13} /> À vérifier
    </div>
  );
}

function PRBody({ post }: { post: FeedPost }) {
  return (
    <>
      <PostMedia
        path={post.media_url}
        postType="pr"
        mediaType={post.media_type ?? "video"}
        className="mt-3 aspect-[9/16] max-h-[360px] w-full rounded-xl bg-black object-contain"
      />
      <PRBlock post={post} />
    </>
  );
}

export function PRBlock({ post }: { post: FeedPost }) {
  const pr = post.pr;
  const [status, setStatus] = useState(pr?.status ?? "pending");
  const [validCount, setValidCount] = useState(pr?.valid_count ?? 0);
  const [doubtCount, setDoubtCount] = useState(pr?.doubt_count ?? 0);
  const [myVote, setMyVote] = useState<"valid" | "doubt" | null>(pr?.my_vote ?? null);
  const [pending, setPending] = useState(false);

  const submitVote = async (next: "valid" | "doubt") => {
    if (!pr || pr.is_own || pending || myVote === next) return;
    setPending(true);
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
      const res = await voteOnPR({ prId: pr.id, vote: next });
      setValidCount(res.valid_count);
      setDoubtCount(res.doubt_count);
      setStatus(res.status);
      setMyVote(res.my_vote);
      if (res.transitioned_to_verified) {
        toast.success("Record vérifié par la communauté.");
        if (pr) track("pr_verified", { exercise: pr.exercise });
      }
    } catch (e: any) {
      setValidCount(prev.validCount);
      setDoubtCount(prev.doubtCount);
      setMyVote(prev.myVote);
      setStatus(prev.status);
      toast.error(friendlyError(e, "Vote impossible."));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="mt-3 rounded-xl bg-secondary p-3">
        <p className="text-xs font-semibold text-arena-sub">
          {pr?.exercise_name ?? pr?.exercise ?? "Record"}
        </p>
        <p className="mt-1 text-xl font-black text-foreground">
          {pr?.weight_kg ?? "—"} kg ·{" "}
          <span className="text-arena">
            {pr?.reps ?? 1} rep{(pr?.reps ?? 1) > 1 ? "s" : ""}
          </span>
        </p>
        <PRBadge status={status} />
      </div>

      {pr && (
        <div className="mt-3">
          {pr.is_own ? (
            <p className="text-[11px] text-arena-muted">
              Ton record — la communauté vote ({validCount} valide · {doubtCount} douteux).
            </p>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => submitVote("valid")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                  myVote === "valid"
                    ? "border-arena-green bg-arena-green/15 text-arena-green"
                    : "border-arena-border bg-arena-surface text-arena-sub"
                }`}
              >
                <ThumbsUp size={14} /> Valide · {validCount}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => submitVote("doubt")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                  myVote === "doubt"
                    ? "border-red-500 bg-red-500/15 text-red-400"
                    : "border-arena-border bg-arena-surface text-arena-sub"
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

export function MealMacros({ meal }: { meal: NonNullable<FeedPost["meal"]> }) {
  const items: Array<[string, number | null, string]> = [
    ["kcal", meal.kcal, ""],
    ["prot.", meal.protein_g, " g"],
    ["gluc.", meal.carbs_g, " g"],
    ["lip.", meal.fat_g, " g"],
  ];
  const visible = items.filter(([, v]) => v !== null && v !== undefined);
  if (visible.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-arena-sub">
      {visible.map(([label, value, unit]) => (
        <span key={label}>
          <span className="font-semibold text-foreground">
            {Math.round(value as number)}
            {unit}
          </span>{" "}
          {label}
        </span>
      ))}
    </div>
  );
}

function MealBody({ post }: { post: FeedPost }) {
  const legacy = post.macros
    ? {
        name: null,
        kcal: post.macros["kcal"] ?? null,
        protein_g: post.macros["prot"] ?? post.macros["protein"] ?? null,
        carbs_g: post.macros["carbs"] ?? null,
        fat_g: post.macros["fat"] ?? post.macros["fats"] ?? null,
      }
    : null;
  const meal = post.meal ?? legacy;
  return (
    <>
      {post.media_url && (
        <PostMedia
          path={post.media_url}
          postType={post.type}
          mediaType={post.media_type}
          alt={post.meal?.name ?? post.caption ?? "repas"}
          className="mt-3 h-56 w-full rounded-xl bg-black object-cover"
        />
      )}
      {post.meal?.name && (
        <p className="mt-3 text-sm font-semibold text-foreground">{post.meal.name}</p>
      )}
      {meal && <MealMacros meal={meal} />}
    </>
  );
}

function WorkoutBody({ post }: { post: FeedPost }) {
  return (
    <>
      {post.media_url && (
        <PostMedia
          path={post.media_url}
          postType={post.type}
          mediaType={post.media_type}
          className="mt-3 max-h-[420px] w-full rounded-xl bg-black object-cover"
        />
      )}
      {post.muscle_groups && post.muscle_groups.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-arena-sub">
          {post.muscle_groups.map((m) => (
            <span key={m} className="inline-flex items-center gap-1">
              <Dumbbell size={11} /> {m}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function LevelBody({ post }: { post: FeedPost }) {
  return (
    <div className="mt-3 rounded-xl border border-arena-border bg-arena-surface p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-arena-gold">
        <Zap size={13} /> Nouveau grade
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{post.caption}</p>
    </div>
  );
}
