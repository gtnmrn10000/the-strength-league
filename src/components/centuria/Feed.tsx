import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Trophy, Target, Flame } from "lucide-react";
import PostCard from "./social/PostCard";
import { fetchFeed, type FeedPost } from "@/lib/social";
import { loadUserProfile, goalLabel } from "./userProfile";
import { GoalIcon } from "@/lib/gradeIcons";

export default function Feed({ onCreate }: { onCreate: () => void }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
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

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <QuickStats goal={profile?.goal ?? null} />
        <Link
          to="/discover"
          className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-arena-border bg-arena-surface active:scale-95 transition-transform"
          aria-label="Découvrir"
        >
          <Search size={18} className="text-arena" />
        </Link>
      </div>

      <h3 className="mb-3 mt-2 text-xs font-black tracking-widest text-arena-muted">FEED</h3>

      {loading && (
        <p className="py-10 text-center text-sm text-arena-muted">Chargement du feed…</p>
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
        onClick={onCreate}
        className="fixed bottom-20 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-arena text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] active:scale-90 transition-transform"
        aria-label="Log un PR"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

function QuickStats({ goal }: { goal: string | null }) {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Trophy, label: "Rang", value: "#—", color: "text-arena-gold" },
          { icon: Target, label: "Grade", value: "RECRUE", color: "text-arena" },
          { icon: Flame, label: "Série", value: "1j", color: "text-arena" },
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
