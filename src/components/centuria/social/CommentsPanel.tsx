import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, Send, Trash2, Flag, Loader2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import ReportSheet from "./ReportSheet";
import {
  fetchCommentThreads,
  addComment,
  deleteComment,
  toggleCommentLike,
  type CommentThread,
  type PostComment,
} from "@/lib/social";
import { friendlyError } from "@/lib/errors";

function shortAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.round(diff / 60)} min`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h`;
  return `${Math.round(diff / 86400)} j`;
}

function countAll(threads: CommentThread[]) {
  return threads.reduce((n, t) => n + 1 + t.replies.length, 0);
}

/**
 * Liste de commentaires façon réseau social : fil racine + réponses d'un niveau,
 * likes, suppression, signalement, composer collant en bas.
 */
export default function CommentsPanel({
  postId,
  onCountChange,
  className = "",
}: {
  postId: string;
  onCountChange?: (n: number) => void;
  className?: string;
}) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; pseudo: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reportTarget, setReportTarget] = useState<PostComment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetchCommentThreads(postId);
      setThreads(res.threads);
      setHasMore(res.hasMore);
      onCountChange?.(countAll(res.threads));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
    // onCountChange volontairement hors deps : callback parent non stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    const oldest = threads[0];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchCommentThreads(postId, { before: oldest.created_at });
      setThreads((prev) => [...res.threads, ...prev]);
      setHasMore(res.hasMore);
    } catch {
      toast.error("Chargement impossible.");
    } finally {
      setLoadingMore(false);
    }
  };

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const parentId = replyTo?.id ?? null;
    try {
      await addComment(postId, text, parentId);
      setBody("");
      setReplyTo(null);
      if (parentId) setExpanded((s) => new Set(s).add(parentId));
      const res = await fetchCommentThreads(postId);
      setThreads(res.threads);
      setHasMore(res.hasMore);
      onCountChange?.(countAll(res.threads));
    } catch (e) {
      toast.error(friendlyError(e, "Commentaire impossible."));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    const before = threads;
    const next = threads
      .filter((t) => t.id !== id)
      .map((t) => ({ ...t, replies: t.replies.filter((r) => r.id !== id) }));
    setThreads(next);
    onCountChange?.(countAll(next));
    try {
      await deleteComment(id);
    } catch {
      setThreads(before);
      onCountChange?.(countAll(before));
      toast.error("Suppression impossible.");
    }
  };

  const like = async (comment: PostComment) => {
    const next = !comment.liked_by_me;
    const apply = (c: PostComment): PostComment =>
      c.id === comment.id
        ? { ...c, liked_by_me: next, like_count: Math.max(0, c.like_count + (next ? 1 : -1)) }
        : c;
    setThreads((prev) =>
      prev.map((t) => ({ ...apply(t), replies: t.replies.map(apply) }) as CommentThread),
    );
    try {
      await toggleCommentLike(comment.id, comment.liked_by_me);
    } catch (e) {
      setThreads((prev) =>
        prev.map((t) => {
          const revert = (c: PostComment): PostComment =>
            c.id === comment.id
              ? { ...c, liked_by_me: comment.liked_by_me, like_count: comment.like_count }
              : c;
          return { ...revert(t), replies: t.replies.map(revert) } as CommentThread;
        }),
      );
      toast.error(friendlyError(e, "Action impossible."));
    }
  };

  const startReply = (c: PostComment) => {
    setReplyTo({ id: c.parent_id ?? c.id, pseudo: c.author?.pseudo ?? "Athlète" });
    inputRef.current?.focus();
  };

  const renderComment = (c: PostComment, isReply: boolean) => (
    <div key={c.id} className="flex gap-3">
      <UserAvatar src={c.author?.avatar_url} pseudo={c.author?.pseudo} size={isReply ? 26 : 32} />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm leading-snug text-foreground/90">
          <span className="font-semibold text-foreground">{c.author?.pseudo ?? "Athlète"}</span>{" "}
          {c.body}
        </p>
        <div className="mt-1 flex items-center gap-4 text-[11px] text-arena-muted">
          <span>{shortAgo(c.created_at)}</span>
          {c.like_count > 0 && (
            <span>
              {c.like_count} j'aime{c.like_count > 1 ? "" : ""}
            </span>
          )}
          <button type="button" onClick={() => startReply(c)} className="py-1 font-semibold">
            Répondre
          </button>
          {c.is_mine ? (
            <button
              type="button"
              onClick={() => remove(c.id)}
              aria-label="Supprimer le commentaire"
              className="py-1"
            >
              <Trash2 size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setReportTarget(c)}
              aria-label="Signaler le commentaire"
              className="py-1"
            >
              <Flag size={13} />
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => like(c)}
        aria-label={c.liked_by_me ? "Retirer le j'aime" : "Aimer le commentaire"}
        aria-pressed={c.liked_by_me}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-arena-muted transition-transform active:scale-95"
      >
        <Heart size={14} className={c.liked_by_me ? "fill-arena text-arena" : ""} />
      </button>
    </div>
  );

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="space-y-4" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-arena-surface" />
            ))}
          </div>
        )}

        {!loading && failed && (
          <div className="py-8 text-center">
            <p className="text-sm text-arena-muted">Commentaires indisponibles pour l'instant.</p>
            <button onClick={() => void load()} className="mt-2 text-xs font-semibold text-arena">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !failed && threads.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-foreground">Pas encore de commentaire.</p>
            <p className="mt-1 text-xs text-arena-muted">Lance la discussion.</p>
          </div>
        )}

        {!loading && !failed && threads.length > 0 && (
          <div className="flex flex-col gap-4">
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="self-start text-xs font-semibold text-arena-sub"
              >
                {loadingMore ? "Chargement…" : "Voir les commentaires précédents"}
              </button>
            )}
            {threads.map((t) => (
              <div key={t.id} className="flex flex-col gap-3">
                {renderComment(t, false)}
                {t.replies.length > 0 && (
                  <div className="ml-11 flex flex-col gap-3">
                    {expanded.has(t.id) ? (
                      t.replies.map((r) => renderComment(r, true))
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpanded((s) => new Set(s).add(t.id))}
                        className="self-start text-xs font-semibold text-arena-sub"
                      >
                        Voir les {t.replies.length} réponse{t.replies.length > 1 ? "s" : ""}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-arena-border bg-background px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between text-[11px] text-arena-sub">
            <span>Réponse à {replyTo.pseudo}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="font-semibold">
              Annuler
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            maxLength={500}
            placeholder={replyTo ? "Ta réponse…" : "Ajoute un commentaire…"}
            aria-label="Écrire un commentaire"
            className="min-w-0 flex-1 rounded-full border border-arena-border bg-arena-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-arena/50"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !body.trim()}
            aria-label="Envoyer le commentaire"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-arena text-arena-foreground transition-transform active:scale-95 disabled:opacity-40"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <ReportSheet
        open={!!reportTarget}
        onOpenChange={(v) => !v && setReportTarget(null)}
        targetType="comment"
        targetId={reportTarget?.id ?? ""}
        targetUserId={reportTarget?.user_id ?? ""}
      />
    </div>
  );
}
