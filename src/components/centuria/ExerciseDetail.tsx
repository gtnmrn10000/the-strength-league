import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TrendingUp, Dumbbell, Layers, Info } from "lucide-react";
import {
  fetchProgress,
  formatDateShort,
  formatVolume,
  statsFor,
  type ExerciseStats,
  type ProgressData,
} from "@/lib/progress";

export default function ExerciseDetail({
  open,
  onOpenChange,
  exerciseName,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exerciseName: string | null;
  data?: ProgressData | null;
}) {
  const [progress, setProgress] = useState<ProgressData | null>(data ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (data) {
      setProgress(data);
      return;
    }
    setLoading(true);
    fetchProgress()
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, [open, data]);

  const stats: ExerciseStats | undefined =
    progress && exerciseName ? statsFor(progress, exerciseName) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] max-w-md mx-auto overflow-y-auto bg-background border-arena-border p-0"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-left text-sm font-black tracking-widest text-foreground">
            {exerciseName?.toUpperCase() ?? "EXERCICE"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-4">
          {loading && <p className="py-8 text-center text-xs text-arena-muted">Chargement…</p>}

          {!loading && !stats && (
            <div className="rounded-2xl border border-dashed border-arena-border p-6 text-center">
              <p className="text-sm text-arena-muted">Aucune donnée pour cet exercice.</p>
              <p className="mt-1 text-[11px] text-arena-sub">
                Termine une séance avec cet exercice pour suivre ta progression.
              </p>
            </div>
          )}

          {!loading && stats && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat
                  icon={Dumbbell}
                  label="Meilleure charge"
                  value={
                    stats.bestWeight && stats.bestWeight.weight_kg > 0
                      ? `${stats.bestWeight.weight_kg} kg × ${stats.bestWeight.reps}`
                      : "—"
                  }
                />
                <Stat
                  icon={TrendingUp}
                  label="Dernière perf"
                  value={
                    stats.last
                      ? `${stats.last.topWeight} kg × ${stats.last.topReps}`
                      : "—"
                  }
                />
                <Stat
                  icon={Layers}
                  label="Meilleur set (volume)"
                  value={
                    stats.bestSetVolume && stats.bestSetVolume.volume > 0
                      ? `${stats.bestSetVolume.weight_kg} kg × ${stats.bestSetVolume.reps}`
                      : "—"
                  }
                />
                <Stat icon={Layers} label="Séances" value={String(stats.sessions)} />
              </div>

              {stats.estimated1RM ? (
                <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-arena-border bg-secondary px-3 py-2 text-[11px] text-arena-sub">
                  <Info size={12} className="shrink-0 text-arena" />
                  <span>
                    1RM <span className="font-black text-foreground">estimé</span> à{" "}
                    <span className="font-black text-arena">{stats.estimated1RM} kg</span> — estimation
                    calculée, pas un record réel.
                  </span>
                </p>
              ) : null}

              <h4 className="mb-2 mt-5 text-[10px] font-black tracking-widest text-arena-muted">
                HISTORIQUE RÉCENT
              </h4>
              <ul className="flex flex-col gap-2">
                {stats.history.slice(0, 6).map((h, i) => (
                  <li
                    key={`${h.date}-${i}`}
                    className="flex items-center justify-between rounded-xl border border-arena-border bg-arena-surface px-3 py-2"
                  >
                    <span className="text-xs text-arena-sub">{formatDateShort(h.date)}</span>
                    <span className="text-xs font-black text-foreground">
                      {h.topWeight} kg × {h.topReps}
                    </span>
                    <span className="text-[10px] text-arena-muted">
                      {h.sets} séries · {formatVolume(h.volume)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-3">
      <Icon size={14} className="text-arena" />
      <p className="mt-1 text-sm font-black text-foreground">{value}</p>
      <p className="text-[10px] text-arena-muted">{label}</p>
    </div>
  );
}
