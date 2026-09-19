import { useEffect, useState } from "react";
import { Bell, UserPlus, Flame, MessageCircle, ShieldCheck, Trophy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UserAvatar from "./UserAvatar";
import {
  fetchNotifications,
  markAllRead,
  notificationLabel,
  type AppNotification,
} from "@/lib/notifications";

function iconFor(type: string) {
  switch (type) {
    case "follow":
      return <UserPlus size={16} className="text-arena" />;
    case "hype":
      return <Flame size={16} className="text-arena" />;
    case "comment":
      return <MessageCircle size={16} className="text-arena" />;
    case "grade_up":
      return <Trophy size={16} className="text-arena" />;
    default:
      return <ShieldCheck size={16} className="text-arena" />;
  }
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}j`;
}

export default function NotificationsSheet({
  open,
  onOpenChange,
  onRead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRead?: () => void;
}) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const rows = await fetchNotifications();
      if (cancelled) return;
      setItems(rows);
      setLoading(false);
      await markAllRead();
      onRead?.();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[80vh] flex-col rounded-t-3xl border-arena-border bg-background p-0"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Bell size={16} className="text-arena" /> Notifications
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {loading && <p className="py-8 text-center text-sm text-arena-muted">Chargement…</p>}

          {!loading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-arena-border p-8 text-center">
              <Bell size={22} className="mx-auto mb-2 text-arena-muted" />
              <p className="text-sm text-arena-muted">Aucune notification pour l'instant.</p>
              <p className="mt-1 text-xs text-arena-muted">
                Suis des athlètes et poste tes séances pour lancer la machine.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                  n.read_at
                    ? "border-arena-border bg-arena-surface"
                    : "border-arena/40 bg-arena/10"
                }`}
              >
                {n.actor ? (
                  <UserAvatar src={n.actor.avatar_url} pseudo={n.actor.pseudo} size={34} />
                ) : (
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-arena/15">
                    {iconFor(n.type)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm text-foreground">{notificationLabel(n)}</p>
                  <p className="text-[10px] text-arena-muted">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
