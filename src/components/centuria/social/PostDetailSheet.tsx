import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Flame, Bookmark, Dumbbell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UserAvatar from "./UserAvatar";
import { PostMedia } from "./PostMedia";
import { PRBlock, MealMacros } from "./PostCard";
import CommentsPanel from "./CommentsPanel";
import { toggleHype, toggleSave, type FeedPost } from "@/lib/social";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { friendlyError } from "@/lib/errors";
import { GradeEmblem } from "../grades/GradeEmblem";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!post) return;
    setHyped(post.hyped_by_me);
    setHypeCount(post.hype_count);
    setSaved(post.saved_by_me);
  }, [post?.id]);

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

  const onSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, saved);
    } catch (e) {
      setSaved(!next);
      toast.error(friendlyError(e, "Enregistrement impossible."));
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
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-arena-gold">
                  <GradeEmblem grade={grade} size={22} /> {GRADE_LABELS[grade]}
                </span>
              </div>
              <span className="text-[11px] text-arena-sub">
                {TYPE_LABEL[post.type] ?? "Publication"} · {dateLabel(post.created_at)}
              </span>
            </div>
          </Link>
        </SheetHeader>

        <div className="max-h-[45vh] shrink-0 overflow-y-auto px-4 py-3">
          {post.media_url && (
            <PostMedia
              path={post.media_url}
              postType={post.type}
              mediaType={post.media_type}
              alt={post.caption ?? ""}
              className="max-h-[40vh] w-full rounded-2xl bg-black object-contain"
            />
          )}

          {post.type === "pr" && <PRBlock post={post} />}

          {post.type === "meal" && post.meal && (
            <>
              {post.meal.name && (
                <p className="mt-3 text-sm font-semibold text-foreground">{post.meal.name}</p>
              )}
              <MealMacros meal={post.meal} />
            </>
          )}

          {post.type !== "pr" && post.muscle_groups && post.muscle_groups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-arena-sub">
              {post.muscle_groups.map((m) => (
                <span key={m} className="inline-flex items-center gap-1">
                  <Dumbbell size={11} /> {m}
                </span>
              ))}
            </div>
          )}

          {post.caption && (
            <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">{post.caption}</p>
          )}

          <div className="mt-4 flex items-center gap-4 border-t border-arena-border pt-3 text-arena-sub">
            <button
              onClick={onHype}
              aria-label={hyped ? "Retirer le hype" : "Hype"}
              className={`flex items-center gap-1.5 text-xs ${hyped ? "text-arena" : ""}`}
            >
              <Flame size={17} className={hyped ? "fill-arena text-arena" : ""} />
              <span className="font-semibold">{hypeCount}</span>
            </button>
            <button
              onClick={onSave}
              aria-label={saved ? "Retirer des enregistrements" : "Enregistrer"}
              className="flex items-center gap-1.5 text-xs"
            >
              <Bookmark size={17} className={saved ? "fill-foreground text-foreground" : ""} />
            </button>
          </div>
        </div>

        {open && <CommentsPanel postId={post.id} />}

      </SheetContent>
    </Sheet>
  );
}
