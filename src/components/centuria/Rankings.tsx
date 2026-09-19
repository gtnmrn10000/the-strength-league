import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeEmblem } from "./grades/GradeEmblem";
import UserAvatar from "./social/UserAvatar";
import { fetchMyXpRanks, fetchXpLeaderboard, type XpLeaderboardRow, type XpRanks } from "@/lib/rankings";

export default function Rankings() {
  const [scope, setScope] = useState<"global" | "grade">("global");
  const [rows, setRows] = useState<XpLeaderboardRow[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [myRanks, setMyRanks] = useState<XpRanks | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
       const rank = await fetchMyXpRanks();
       const grade = scope === "grade" ? (rank?.current_grade as Grade | undefined) : undefined;
       const lb = await fetchXpLeaderboard({ grade, limit: 30 });
      if (cancelled) return;
      setMe(userData?.user?.id ?? null);
       setRows(lb);
       setHasMore(lb.length === 30);
       setMyRanks(rank);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await fetchXpLeaderboard({ grade: scope === "grade" ? myRanks?.current_grade as Grade : undefined, limit: 30, offset: rows.length });
      setRows((current) => [...current, ...more]);
      setHasMore(more.length === 30);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="px-4 pt-2 pb-4">
       <div className="mb-4 grid grid-cols-2 border-b border-arena-border">
         {(["global", "grade"] as const).map((x) => (
          <button
            key={x}
             onClick={() => setScope(x)}
             className={`min-h-11 border-b-2 px-4 py-2 text-xs font-bold ${scope === x ? "border-arena text-foreground" : "border-transparent text-arena-sub"}`}
          >
             {x === "global" ? "Global" : "Mon grade"}
          </button>
        ))}
      </div>
       <>
          <p className="mb-3 flex items-start gap-1.5 rounded-xl border border-arena-border bg-arena-surface px-3 py-2 text-[10px] text-arena-sub">
            <Info size={12} className="mt-0.5 shrink-0 text-arena" />
            <span>
               Classement basé sur l’XP gagné par des actions validées. Le rang sportif des records reste distinct.
            </span>
          </p>

          {loading && <p className="py-8 text-center text-xs text-arena-muted">Chargement…</p>}

          {!loading && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-arena-border p-6 text-center">
              <p className="text-sm font-black text-foreground">Pas encore assez de participants</p>
              <p className="mt-1 text-[11px] text-arena-sub">
                Le classement s'ouvre dès que des PR sont vérifiés par la communauté.
              </p>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="flex flex-col gap-2">
              {rows.map((r, i) => {
                const grade = r.current_grade as Grade;
                const isMe = r.user_id === me;
                 const pos = scope === "global" ? r.global_rank : r.grade_rank;
                return (
                  <div
                    key={r.user_id}
                     className={`flex min-h-16 items-center gap-3 border-b px-1 py-3 ${isMe ? "border-arena bg-arena/5" : "border-arena-border"}`}
                  >
                     <span className={`w-8 text-base font-black ${pos <= 3 ? "text-arena-gold" : "text-arena-sub"}`}>
                      #{pos}
                    </span>
                     <UserAvatar src={r.avatar_url} pseudo={r.pseudo} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">
                        {r.pseudo}
                        {isMe ? " · toi" : ""}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-arena-sub">
                         <GradeEmblem grade={grade} size={28} context="compact" animated />
                         {GRADE_LABELS[grade] ?? "—"} · rang #{r.grade_rank}
                      </p>
                    </div>
                    <span className="shrink-0 font-black text-foreground">
                       {r.xp.toLocaleString()} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}

           {!loading && myRanks && (
            <p className="mt-3 text-center text-xs text-arena-sub">
               {scope === "global"
                 ? `Tu es #${myRanks.global_rank} sur ${myRanks.global_participants}.`
                 : `Tu es #${myRanks.grade_rank} sur ${myRanks.grade_participants} en ${GRADE_LABELS[myRanks.current_grade as Grade]}.`}
            </p>
          )}
           {!loading && hasMore && <button type="button" onClick={loadMore} disabled={loadingMore} className="mt-4 min-h-11 w-full border border-arena-border text-xs font-semibold text-foreground disabled:opacity-50">{loadingMore ? "Chargement…" : "Afficher plus"}</button>}
        </>
    </div>
  );
}
