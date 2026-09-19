import { useEffect, useState } from "react";
import { Info, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeEmblem } from "./grades/GradeEmblem";

type Row = {
  user_id: string;
  pseudo: string;
  avatar_url: string | null;
  current_grade: string;
  xp: number;
  verified_total: number;
  verified_prs: number;
};

export default function Rankings() {
  const [sub, setSub] = useState<"Classements" | "Duels">("Classements");
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<{ rank: number; participants: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const [lb, rank] = await Promise.all([
        supabase.rpc("get_leaderboard", { _limit: 50 }),
        supabase.rpc("get_my_rank").maybeSingle(),
      ]);
      if (cancelled) return;
      setMe(userData?.user?.id ?? null);
      setRows(((lb.data as Row[] | null) ?? []).map((r) => ({ ...r, verified_total: Number(r.verified_total) })));
      const rk = rank.data as { rank: number; participants: number } | null;
      setMyRank(rk ? { rank: rk.rank, participants: rk.participants } : null);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-4 flex gap-2">
        {(["Classements", "Duels"] as const).map((x) => (
          <button
            key={x}
            onClick={() => setSub(x)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${sub === x ? "bg-arena text-arena-foreground" : "border border-arena-border bg-arena-surface text-arena-sub"}`}
          >
            {x}
          </button>
        ))}
      </div>

      {sub === "Classements" && (
        <>
          <p className="mb-3 flex items-start gap-1.5 rounded-xl border border-arena-border bg-arena-surface px-3 py-2 text-[10px] text-arena-sub">
            <Info size={12} className="mt-0.5 shrink-0 text-arena" />
            <span>
              Total des meilleures charges par mouvement, uniquement sur les PR vérifiés par la
              communauté.
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
                const pos = i + 1;
                const grade = r.current_grade as Grade;
                const isMe = r.user_id === me;
                return (
                  <div
                    key={r.user_id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${isMe ? "border-arena bg-arena/10" : "border-arena-border bg-arena-surface"}`}
                  >
                    <span className={`w-9 text-lg font-black ${pos <= 3 ? "text-arena-gold" : "text-arena-sub"}`}>
                      #{pos}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">
                        {r.pseudo}
                        {isMe ? " · toi" : ""}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-arena-sub">
                        <GradeEmblem grade={grade} size={24} />
                        {GRADE_LABELS[grade] ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 font-black text-foreground">
                      {r.verified_total > 0 ? `${Math.round(r.verified_total)} kg` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && myRank && (
            <p className="mt-3 text-center text-xs text-arena-sub">
              Tu es #{myRank.rank} sur {myRank.participants} athlète
              {myRank.participants > 1 ? "s" : ""} classé{myRank.participants > 1 ? "s" : ""}.
            </p>
          )}
          {!loading && !myRank && rows.length > 0 && (
            <p className="mt-3 text-center text-xs text-arena-sub">
              Fais vérifier un PR pour apparaître au classement.
            </p>
          )}
        </>
      )}

      {sub === "Duels" && (
        <div className="rounded-2xl border border-dashed border-arena-border p-6 text-center">
          <Trophy size={20} className="mx-auto text-arena-muted" />
          <p className="mt-2 text-sm font-black text-foreground">Duels bientôt disponibles</p>
          <p className="mt-1 text-[11px] text-arena-sub">
            Les défis entre athlètes arrivent avec les fonctionnalités sociales.
          </p>
        </div>
      )}
    </div>
  );
}
