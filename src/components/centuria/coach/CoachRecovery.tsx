import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getRecentMuscleWork } from "@/lib/coach.functions";
import { computeRecovery, type RecoveryState } from "@/lib/recovery";

export default function CoachRecovery({ refreshKey }: { refreshKey?: number }) {
  const [sessions, setSessions] = useState<Array<{ muscle_groups: string[]; completed_at: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getRecentMuscleWork();
        if (!cancel) setSessions(data);
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

  const rows = useMemo(() => computeRecovery(sessions), [sessions]);

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-xs text-arena-muted">
        Estimation basée sur tes dernières séances loggées. 100 % = frais, 0 % = tout juste sollicité.
      </p>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-arena-muted" />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <RecoveryRow key={r.group} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RecoveryRow({ r }: { r: RecoveryState }) {
  const color = r.status === "fresh" ? "bg-green-500" : r.status === "recovering" ? "bg-yellow-500" : "bg-red-500";
  const dot = r.status === "fresh" ? "text-green-400" : r.status === "recovering" ? "text-yellow-400" : "text-red-400";
  return (
    <li className="rounded-2xl border border-arena-border bg-arena-surface p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-black text-foreground">
          <span className={`mr-2 ${dot}`}>●</span>
          {r.label}
        </span>
        <span className="text-[11px] text-arena-muted">
          {r.hoursSince == null
            ? "jamais loggé"
            : r.hoursSince < 1
              ? "< 1 h"
              : `il y a ${r.hoursSince} h · plein dans ${Math.max(0, r.hoursTotal - r.hoursSince)} h`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${r.percent}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-arena-muted">
        <span>{r.percent}%</span>
        <span>fenêtre {r.hoursTotal} h</span>
      </div>
    </li>
  );
}
