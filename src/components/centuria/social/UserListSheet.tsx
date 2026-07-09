import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UserAvatar from "./UserAvatar";
import FollowButton from "./FollowButton";
import { fetchFollowers, fetchFollowing, type PublicProfile } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";

export default function UserListSheet({
  open,
  onOpenChange,
  userId,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  mode: "followers" | "following";
}) {
  const [list, setList] = useState<PublicProfile[]>([]);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    (mode === "followers" ? fetchFollowers(userId) : fetchFollowing(userId)).then(setList);
  }, [open, userId, mode]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-arena-border bg-background">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {mode === "followers" ? "Followers" : "Suit"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-3 pb-6">
          {list.length === 0 && (
            <p className="text-center text-sm text-arena-muted">Personne pour l'instant.</p>
          )}
          {list.map((p) => (
            <div key={p.user_id} className="flex items-center gap-3">
              <Link
                to="/profile/$userId"
                params={{ userId: p.user_id }}
                onClick={() => onOpenChange(false)}
                className="flex flex-1 items-center gap-3"
              >
                <UserAvatar src={p.avatar_url} pseudo={p.pseudo} size={44} />
                <div className="flex-1">
                  <p className="font-black text-foreground">{p.pseudo}</p>
                  <p className="text-xs text-arena-sub">{p.followers_count} followers</p>
                </div>
              </Link>
              {me && me !== p.user_id && (
                <FollowButton targetId={p.user_id} size="sm" />
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
