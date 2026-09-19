import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Trophy, Target, Flame, Bell } from "lucide-react";
import NotificationsSheet from "./social/NotificationsSheet";
import { countUnread } from "@/lib/notifications";
import PostCard from "./social/PostCard";
import PostComposer from "./social/PostComposer";
import { fetchFeed, type FeedPost } from "@/lib/social";
import { loadUserProfile, goalLabel } from "./userProfile";
import { GoalIcon } from "@/lib/gradeIcons";
import { supabase } from "@/integrations/supabase/client";
import { fetchProgress } from "@/lib/progress";
import { GRADE_LABELS, type Grade } from "@/lib/grades";

export default function Feed({ onCreate }: { onCreate: () => void }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const profile = loadUserProfile();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFeedError(false);
    fetchFeed()
      .then((r) => {
        if (!active) return;
        setPosts(r);
      })
      .catch(() => {
        if (!active) return;
        setPosts([]);
        setFeedError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void countUnread().then((n) => {
      if (active) setUnread(n);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <QuickStats goal={profile?.goal ?? null} />
        <div className="ml-3 flex shrink-0 items-center gap-2">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-arena-border bg-arena-surface transition-transform active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-arena" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-arena px-1 text-[10px] font-black text-arena-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <Link
            to="/discover"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-arena-border bg-arena-surface active:scale-95 transition-transform"
            aria-label="Découvrir"
          >
            <Search size={18} className="text-arena" />
          </Link>
        </div>
      </div>

      <h3 className="mb-3 mt-2 text-xs font-black tracking-widest text-arena-muted">FEED</h3>

      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-arena-border bg-arena-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded bg-secondary" />
                  <div className="h-2.5 w-16 rounded bg-secondary" />
                </div>
              </div>
              <div className="mt-3 h-40 rounded-xl bg-secondary" />
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-arena-border p-6 text-center">
          <p className="text-sm text-arena-muted">
            {feedError ? "Le feed est temporairement indisponible." : "Le feed est encore vide."}
          </p>
          <Link
            to="/discover"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-arena underline"
          >
            <Search size={12} /> Trouve des athlètes à suivre
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <button
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-20 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-arena text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] active:scale-90 transition-transform"
        aria-label="Publier"
      >
        <Plus size={24} />
      </button>

      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onPickPR={onCreate}
        onPosted={() => {
          void fetchFeed().then(setPosts).catch(() => undefined);
        }}
      />

      <NotificationsSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
        onRead={() => setUnread(0)}
      />
    </div>
  );
}

function QuickStats({ goal }: { goal: string | null }) {
  const [grade, setGrade] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [weekSessions, setWeekSessions] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prof, rk, prog] = await Promise.all([
        supabase.rpc("get_my_profile").maybeSingle(),
        supabase.rpc("get_my_rank").maybeSingle(),
        fetchProgress(60),
      ]);
      if (cancelled) return;
      const g = (prof.data as { current_grade?: string } | null)?.current_grade;
      setGrade(g ?? null);
      setRank((rk.data as { rank?: number } | null)?.rank ?? null);
      setWeekSessions(prog.week.sessions);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const gradeLabel = grade ? (GRADE_LABELS[grade as Grade] ?? "—").toUpperCase() : "—";

  return (
    <div className="flex-1">
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Trophy, label: "Rang", value: rank ? `#${rank}` : "—", color: "text-arena-gold" },
          { icon: Target, label: "Grade", value: gradeLabel, color: "text-arena" },
          {
            icon: Flame,
            label: "Séances / sem.",
            value: weekSessions === null ? "—" : String(weekSessions),
            color: "text-arena",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-arena-border bg-arena-surface p-2.5">
            <Icon size={14} className={color} />
            <span className="text-sm font-black text-foreground">{value}</span>
            <span className="text-[9px] text-arena-muted">{label}</span>
          </div>
        ))}
      </div>
      {goal && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-arena/10 px-2.5 py-1 text-[10px] font-bold text-arena">
            <GoalIcon goal={goal} size={12} /> {goalLabel(goal)}
          </span>
        </div>
      )}
    </div>
  );
}
