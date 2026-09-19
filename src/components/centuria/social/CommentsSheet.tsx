import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, Trash2, Flag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UserAvatar from "./UserAvatar";
import ReportSheet from "./ReportSheet";
import { fetchComments, addComment, deleteComment, type PostComment } from "@/lib/social";
import { friendlyError } from "@/lib/errors";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}j`;
}

export default function CommentsSheet({
  open,
  onOpenChange,
  postId,
  onCountChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string;
  onCountChange?: (n: number) => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [reportId, setReportId] = useState<PostComment | null>(null);

  const load = async () => {
    setLoading(true);
    const rows = await fetchComments(postId);
    setComments(rows);
    onCountChange?.(rows.length);
    setLoading(false);
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await addComment(postId, body);
      setBody("");
      await load();
    } catch (e) {
      toast.error(friendlyError(e, "Commentaire impossible."));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteComment(id);
      await load();
    } catch {
      toast.error("Suppression impossible.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85vh] flex-col rounded-t-3xl border-arena-border bg-background p-0"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-foreground">Commentaires</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && <p className="py-8 text-center text-sm text-arena-muted">Chargement…</p>}

          {!loading && comments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-arena-border p-6 text-center">
              <p className="text-sm text-arena-muted">Aucun commentaire pour l'instant.</p>
              <p className="mt-1 text-xs text-arena-muted">Sois le premier à réagir.</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <UserAvatar src={c.author?.avatar_url} pseudo={c.author?.pseudo} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">
                      {c.author?.pseudo ?? "Athlète"}
                    </span>
                    <span className="text-[10px] text-arena-muted">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-foreground/90">{c.body}</p>
                </div>
                {c.is_mine ? (
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="Supprimer le commentaire"
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-arena-muted"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => setReportId(c)}
                    aria-label="Signaler le commentaire"
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-arena-muted"
                  >
                    <Flag size={15} />
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

      {reportId && (
        <ReportSheet
          open={!!reportId}
          onOpenChange={(v) => !v && setReportId(null)}
          targetType="comment"
          targetId={reportId.id}
          targetUserId={reportId.user_id}
        />
      )}
    </Sheet>
  );
}
