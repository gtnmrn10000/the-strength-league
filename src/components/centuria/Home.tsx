import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Flame, Trophy, Target, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProgress, EMPTY_PROGRESS, type ProgressData } from "@/lib/progress";
import { computeRecovery, MUSCLE_LABEL, type RecoveryState } from "@/lib/recovery";
import { GRADE_LABELS, nextGradeInfo, type Grade } from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";
import { fetchMyProfile } from "@/lib/profileStore";

const WEEK_GOAL_KEY = "centuria:week-goal";

function readWeekGoal(): number {
  const raw = Number(localStorage.getItem(WEEK_GOAL_KEY));
  return raw >= 1 && raw <= 7 ? raw : 3;
}

export default function Home({
  onStartWorkout,
  onOpenTraining,
  refreshKey,
}: {
  onStartWorkout: () => void;
  onOpenTraining: () => void;
  refreshKey?: number;
}) {
  const [progress, setProgress] = useState<ProgressData>(EMPTY_PROGRESS);
  const [recovery, setRecovery] = useState<RecoveryState[]>([]);
  const [pseudo, setPseudo] = useState("");
  const [grade, setGrade] = useState<Grade>("recruit");
  const [xp, setXp] = useState(0);
  const [weekGoal, setWeekGoal] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setWeekGoal(readWeekGoal());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [p, prof, sessions] = await Promise.all([
        fetchProgress(60).catch(() => EMPTY_PROGRESS),
        fetchMyProfile().catch(() => null),
        supabase
          .from("workout_sessions")
          .select("muscle_groups, completed_at")
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(40)
          .then((r) => r.data ?? []),
      ]);
      if (cancelled) return;
      setProgress(p);
      if (prof) {
        setPseudo(prof.pseudo ?? "");
        setGrade((prof.current_grade ?? "recruit") as Grade);
        setXp(prof.xp ?? 0);
      }
      setRecovery(
        computeRecovery(
          sessions.map((s) => ({
            muscle_groups: s.muscle_groups,
            completed_at: s.completed_at as string,
          })),
        ),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const gradeInfo = useMemo(() => nextGradeInfo(xp), [xp]);
  const lastRecord = progress.recentRecords[0] ?? null;
  const fatigued = recovery
    .filter((r) => r.status !== "fresh")
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);
  const goalLeft = Math.max(0, weekGoal - progress.week.sessions);

  const setGoal = (n: number) => {
    setWeekGoal(n);
    localStorage.setItem(WEEK_GOAL_KEY, String(n));
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3">
      <p className="text-sm text-arena-sub">
        Bonjour{pseudo ? ` ${pseudo}` : ""}.
      </p>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onStartWorkout}
        className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-arena text-lg font-black text-arena-foreground"
      >
        <Play size={20} /> Démarrer une séance
      </motion.button>

      {/* Semaine */}
      <section className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black tracking-widest text-arena-muted">CETTE SEMAINE</h2>
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className={`h-6 w-6 rounded-lg text-[10px] font-black transition ${
                  weekGoal === n
                    ? "bg-arena text-arena-foreground"
                    : "border border-arena-border text-arena-muted"
                }`}
                aria-label={`Objectif ${n} séances par semaine`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat value={loading ? "—" : String(progress.week.sessions)} label="séances" />
          <Stat value={loading ? "—" : String(progress.week.sets)} label="séries" />
          <Stat
            value={loading ? "—" : `${Math.round(progress.week.volume / 1000)}t`}
            label="volume"
          />
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-arena-gold"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, (progress.week.sessions / weekGoal) * 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-arena-sub">
          <Target size={12} className="text-arena-gold" />
          {goalLeft === 0
            ? "Objectif de la semaine atteint."
            : `Encore ${goalLeft} séance${goalLeft > 1 ? "s" : ""} pour ton objectif.`}
        </p>
      </section>

      {/* Grade */}
      <section className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <GradeIcon grade={grade} size={18} /> {GRADE_LABELS[grade]}
          </span>
          {gradeInfo.nextGrade && (
            <span className="flex items-center gap-1 text-xs text-arena-sub">
              <ArrowRight size={12} /> {GRADE_LABELS[gradeInfo.nextGrade]}
            </span>
          )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-arena"
            initial={{ width: 0 }}
            animate={{ width: `${gradeInfo.progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-xs text-arena-sub">
          {gradeInfo.nextGrade
            ? `${xp.toLocaleString()} XP — encore ${gradeInfo.xpRemaining.toLocaleString()} XP`
            : `${xp.toLocaleString()} XP — grade maximum`}
        </p>
      </section>

      {/* Récupération */}
      {fatigued.length > 0 && (
        <section className="rounded-2xl border border-arena-border bg-arena-surface p-4">
          <h2 className="text-xs font-black tracking-widest text-arena-muted">RÉCUPÉRATION</h2>
          <div className="mt-2 flex flex-col gap-2">
            {fatigued.map((r) => (
              <div key={r.group} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs text-arena-sub">
                  {MUSCLE_LABEL[r.group]}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${
                      r.status === "fatigued" ? "bg-arena" : "bg-arena-gold"
                    }`}
                    style={{ width: `${r.percent}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-[10px] text-arena-muted">
                  {r.percent}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dernier record */}
      <section className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <h2 className="text-xs font-black tracking-widest text-arena-muted">DERNIER RECORD</h2>
        {lastRecord ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <Trophy size={14} className="shrink-0 text-arena-gold" />
            <span className="min-w-0 truncate">
              {lastRecord.name} — {lastRecord.weight_kg} kg × {lastRecord.reps}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-xs text-arena-sub">
            Aucun record pour l'instant. Termine une séance pour en créer un.
          </p>
        )}
        <button
          onClick={onOpenTraining}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-arena-border py-2 text-xs font-bold text-arena-sub active:scale-[0.98] transition"
        >
          <Flame size={13} /> Voir mon entraînement
        </button>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-secondary py-2">
      <p className="text-lg font-black text-foreground">{value}</p>
      <p className="text-[10px] text-arena-muted">{label}</p>
    </div>
  );
}
