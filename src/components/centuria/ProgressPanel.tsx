import { Trophy, Play, ArrowUp, ArrowDown } from "lucide-react";
import { formatDateShort, formatVolume, type ProgressData } from "@/lib/progress";

const MUSCLE_LABEL: Record<string, string> = {
  pectoraux: "Pecs",
  dos: "Dos",
  epaules: "Épaules",
  bras: "Bras",
  biceps: "Biceps",
  triceps: "Triceps",
  jambes: "Jambes",
  quadriceps: "Quadris",
  ischios: "Ischios",
  fessiers: "Fessiers",
  mollets: "Mollets",
  abdos: "Abdos",
};

export default function ProgressPanel({
  data,
  onStart,
  onOpenExercise,
}: {
  data: ProgressData | null;
  onStart?: () => void;
  onOpenExercise?: (name: string) => void;
}) {
  const hasData = !!data && data.totalSessions > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-arena-border p-5 text-center">
        <p className="text-sm font-black text-foreground">Pas encore de progression</p>
        <p className="mt-1 text-[11px] text-arena-sub">
          Tes stats apparaîtront dès ta première séance terminée.
        </p>
        {onStart && (
          <button
            onClick={onStart}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-arena px-4 text-xs font-black tracking-widest text-arena-on active:scale-95 transition"
          >
            <Play size={14} /> COMMENCER UNE SÉANCE
          </button>
        )}
      </div>
    );
  }

  const w = data!.week;
  const p = data!.prevWeek;
  const show = data!.hasPrevWeekData;

  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      <div className="grid grid-cols-3 gap-2">
        <Cell label="Séances" value={String(w.sessions)} delta={show ? w.sessions - p.sessions : null} />
        <Cell label="Séries" value={String(w.sets)} delta={show ? w.sets - p.sets : null} />
        <Cell
          label="Volume"
          value={formatVolume(w.volume)}
          delta={show ? Math.round(w.volume - p.volume) : null}
          deltaUnit="kg"
        />
      </div>

      <p className="mt-2 text-[10px] text-arena-muted">Cette semaine</p>

      {w.muscles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {w.muscles.map((m) => (
            <span
              key={m}
              className="rounded-full bg-arena/10 px-2.5 py-1 text-[10px] font-bold text-arena"
            >
              {MUSCLE_LABEL[m] ?? m}
            </span>
          ))}
        </div>
      )}

      <h4 className="mb-2 mt-4 text-[10px] font-black tracking-widest text-arena-muted">
        DERNIERS RECORDS
      </h4>
      {data!.recentRecords.length === 0 ? (
        <p className="text-[11px] text-arena-sub">Aucun nouveau record sur les 3 dernières semaines.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {data!.recentRecords.map((r) => (
            <li key={`${r.name}-${r.date}`}>
              <button
                onClick={() => onOpenExercise?.(r.name)}
                className="flex w-full items-center justify-between rounded-xl border border-arena-gold/25 bg-arena-gold/5 px-3 py-2 text-left active:scale-[0.99] transition"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Trophy size={12} className="shrink-0 text-arena-gold" />
                  <span className="truncate text-xs font-bold text-foreground">{r.name}</span>
                </span>
                <span className="ml-2 shrink-0 text-xs font-black text-arena-gold">
                  {r.weight_kg} kg × {r.reps}
                  <span className="ml-1.5 text-[9px] font-normal text-arena-sub">
                    ·{" "}
                    {formatDateShort(r.date)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  delta,
  deltaUnit,
}: {
  label: string;
  value: string;
  delta: number | null;
  deltaUnit?: string;
}) {
  return (
    <div className="rounded-xl border border-arena-border bg-secondary p-2.5 text-center">
      <p className="text-base font-black text-foreground">{value}</p>
      <p className="text-[9px] text-arena-muted">{label}</p>
      {delta !== null && delta !== 0 && (
        <p
          className={`mt-0.5 flex items-center justify-center gap-0.5 text-[9px] font-bold ${
            delta > 0 ? "text-arena-gold" : "text-arena-sub"
          }`}
        >
          {delta > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
          {Math.abs(delta)}
          {deltaUnit ?? ""}
        </p>
      )}
    </div>
  );
}
