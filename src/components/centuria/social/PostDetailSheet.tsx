import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Flame, Send, Trash2, Dumbbell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UserAvatar from "./UserAvatar";
import { PostMedia } from "./PostMedia";
import { PRBlock } from "./PostCard";
import {
  toggleHype,
  fetchComments,
  addComment,
  deleteComment,
  type FeedPost,
  type PostComment,
} from "@/lib/social";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { friendlyError } from "@/lib/errors";
import { GradeIcon } from "@/lib/gradeIcons";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}j`;
}

const TYPE_LABEL: Record<string, string> = {
  pr: "Record",
  workout: "Entraînement",
  meal: "Repas",
  level_up: "Nouveau grade",
};

export default function PostDetailSheet({
  post,
  open,
  onOpenChange,
}: {
  post: FeedPost | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [hyped, setHyped] = useState(false);
  const [hypeCount, setHypeCount] = useState(0);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!post) return;
    setHyped(post.hyped_by_me);
    setHypeCount(post.hype_count);
  }, [post?.id]);

  const loadComments = async (postId: string) => {
    setLoading(true);
    setFailed(false);
    try {
      setComments(await fetchComments(postId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && post) void loadComments(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id]);

  if (!post) return null;

  const grade = (post.author?.current_grade || "recruit") as Grade;

  const onHype = async () => {
    const next = !hyped;
    setHyped(next);
    setHypeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleHype(post.id, hyped);
    } catch (e) {
      setHyped(!next);
      setHypeCount((c) => c + (next ? -1 : 1));
      toast.error(friendlyError(e, "Action impossible."));
    }
  };

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await addComment(post.id, body);
      setBody("");
      await loadComments(post.id);
    } catch (e) {
      toast.error(friendlyError(e, "Commentaire impossible."));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteComment(id);
      await loadComments(post.id);
    } catch {
      toast.error("Suppression impossible.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92vh] flex-col rounded-t-3xl border-arena-border bg-background p-0"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3 text-left">
          <SheetTitle className="sr-only">Publication</SheetTitle>
          <Link
            to="/profile/$userId"
            params={{ userId: post.user_id }}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3"
          >
            <UserAvatar src={post.author?.avatar_url} pseudo={post.author?.pseudo} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold text-foreground">
                  {post.author?.pseudo}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black tracking-wider text-arena-gold">
                  <GradeIcon grade={grade} size={10} /> {GRADE_LABELS[grade]?.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] text-arena-sub">
                {TYPE_LABEL[post.type] ?? "Publication"} · {dateLabel(post.created_at)}
              </span>
            </div>
          </Link>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {post.media_url && (
            <PostMedia
              path={post.media_url}
              postType={post.type}
              mediaType={post.media_type}
              alt={post.caption ?? ""}
              className="max-h-[55vh] w-full rounded-2xl bg-black object-contain"
            />
          )}

          {post.type === "pr" && <PRBlock post={post} />}

          {post.type !== "pr" && post.muscle_groups && post.muscle_groups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.muscle_groups.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 rounded-full bg-arena/10 px-2.5 py-1 text-[10px] font-bold text-arena"
                >
                  <Dumbbell size={10} /> {m}
                </span>
              ))}
            </div>
          )}

          {post.caption && (
            <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">{post.caption}</p>
          )}

          <div className="mt-4 flex items-center gap-4 border-y border-arena-border py-3 text-arena-sub">
            <button
              onClick={onHype}
              className={`flex items-center gap-1.5 text-xs ${hyped ? "text-arena" : ""}`}
            >
              <Flame size={17} className={hyped ? "fill-arena text-arena" : ""} />
              <span className="font-bold">{hypeCount}</span>
            </button>
            <span className="text-xs font-bold">
              {comments.length} commentaire{comments.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 pb-2">
            {loading && <div className="h-16 animate-pulse rounded-2xl bg-arena-surface" />}
            {!loading && failed && (
              <p className="text-sm text-arena-muted">Commentaires indisponibles pour l'instant.</p>
            )}
            {!loading && !failed && comments.length === 0 && (
              <p className="text-sm text-arena-muted">
                Pas encore de commentaire. Lance la discussion.
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <UserAvatar src={c.author?.avatar_url} pseudo={c.author?.pseudo} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">
                      {c.author?.pseudo ?? "Athlète"}
                    </span>
                    <span className="text-[10px] text-arena-muted">{shortAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-foreground/90">{c.body}</p>
                </div>
                {c.is_mine && (
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="Supprimer le commentaire"
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-arena-muted"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-arena-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            maxLength={500}
            placeholder="Ajoute un commentaire…"
            className="min-w-0 flex-1 rounded-full border border-arena-border bg-arena-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-arena/50"
          />
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            aria-label="Envoyer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-arena text-arena-foreground disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
