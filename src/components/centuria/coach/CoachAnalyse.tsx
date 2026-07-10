import { useEffect, useState } from "react";
import { Loader2, Dumbbell, Flame, Trophy } from "lucide-react";
import { getWeeklyStats, type WeeklyStats } from "@/lib/coach.functions";
import { MUSCLE_LABEL, type MuscleGroup } from "@/lib/recovery";

export default function CoachAnalyse({ refreshKey }: { refreshKey?: number }) {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const s = await getWeeklyStats();
        if (!cancel) setStats(s);
      } catch {
        // silent
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-arena-muted" />
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="p-6 text-center text-sm text-arena-muted">Aucune donnée à analyser.</div>
    );
  }

  const groups = Object.entries(stats.sessions.by_group).sort((a, b) => b[1] - a[1]);
  const maxGroup = groups[0]?.[1] ?? 1;

  return (
    <div className="overflow-y-auto px-4 py-3">
      <p className="mb-3 text-xs text-arena-muted">Bilan sur les 7 derniers jours.</p>

      {/* Séances */}
      <section className="mb-4 rounded-2xl border border-arena-border bg-arena-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <Dumbbell size={14} className="text-arena" />
          <h4 className="text-xs font-black tracking-widest text-foreground">SÉANCES</h4>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 text-center">
          <Stat value={stats.sessions.count} label="séances" />
          <Stat value={stats.sessions.total_min} label="minutes" />
        </div>
        {groups.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {groups.map(([g, n]) => (
              <li key={g}>
                <div className="mb-0.5 flex justify-between text-[11px]">
                  <span className="text-foreground">{MUSCLE_LABEL[g as MuscleGroup] ?? g}</span>
                  <span className="text-arena-muted">{n}×</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black">
                  <div className="h-full rounded-full bg-arena" style={{ width: `${(n / maxGroup) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-arena-muted">Aucune séance loggée cette semaine.</p>
        )}
      </section>

      {/* Nutrition */}
      <section className="mb-4 rounded-2xl border border-arena-border bg-arena-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <Flame size={14} className="text-arena" />
          <h4 className="text-xs font-black tracking-widest text-foreground">NUTRITION MOY.</h4>
        </div>
        {stats.nutrition.days === 0 ? (
          <p className="text-[11px] text-arena-muted">Aucun aliment loggé cette semaine.</p>
        ) : (
          <>
            <p className="mb-2 text-[10px] text-arena-muted">Sur {stats.nutrition.days} j actifs</p>
            <MacroRow label="Calories" value={stats.nutrition.avg_kcal} goal={stats.nutrition.goals?.kcal} unit="kcal" />
            <MacroRow label="Protéines" value={stats.nutrition.avg_prot} goal={stats.nutrition.goals?.prot} unit="g" />
            <MacroRow label="Glucides" value={stats.nutrition.avg_carbs} goal={stats.nutrition.goals?.carbs} unit="g" />
            <MacroRow label="Lipides" value={stats.nutrition.avg_fats} goal={stats.nutrition.goals?.fats} unit="g" />
          </>
        )}
      </section>

      {/* PRs */}
      <section className="rounded-2xl border border-arena-border bg-arena-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <Trophy size={14} className="text-arena" />
          <h4 className="text-xs font-black tracking-widest text-foreground">RECORDS</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <Stat value={stats.prs.verified_count} label="PR validés (7j)" />
          <Stat
            value={stats.prs.last_pr_at ? new Date(stats.prs.last_pr_at).toLocaleDateString("fr-FR") : "—"}
            label="dernier PR"
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-arena-border bg-background p-2">
      <div className="text-lg font-black text-arena">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-arena-muted">{label}</div>
    </div>
  );
}

function MacroRow({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal?: number;
  unit: string;
}) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const color = !goal ? "bg-arena-muted" : pct < 70 ? "bg-red-500" : pct < 95 ? "bg-orange-500" : pct <= 110 ? "bg-green-500" : "bg-orange-500";
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-0.5 flex justify-between text-[11px]">
        <span className="text-foreground">{label}</span>
        <span className="text-arena-muted">
          {value}{unit}
          {goal ? ` / ${goal}${unit}` : ""}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${goal ? pct : 0}%` }} />
      </div>
    </div>
  );
}
