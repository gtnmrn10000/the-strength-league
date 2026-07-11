import { useEffect, useMemo, useState } from "react";
import { Camera, NotebookPen, Target, Sparkles, Dumbbell, Trophy, Plus, Minus, X, Library, Play, CalendarClock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CoachSheet from "./coach/CoachSheet";
import PremiumBadge from "./paywall/PremiumBadge";
import WorkoutLogger from "./WorkoutLogger";
import GoalEditor from "./GoalEditor";
import ExerciseLibrary from "./ExerciseLibrary";
import BodyDiagram, { type MuscleRecovery } from "./BodyDiagram";
import { TEMPLATES, normalizeMuscle, type Template, type WorkoutExercise } from "@/lib/workoutTemplates";
import { imageForExerciseName, type LibraryExercise } from "@/lib/exerciseCatalog";
import { computeRecovery, type MuscleGroup } from "@/lib/recovery";

interface VerifiedPR {
  exercise: string;
  weight_kg: number;
  reps: number;
  created_at: string;
}

interface WorkoutHistoryRow {
  id: string;
  name: string | null;
  muscle_groups: string[] | null;
  duration_min: number | null;
  completed_at: string;
  exercises: unknown;
}

interface PlannedRow {
  id: string;
  name: string | null;
  muscle_groups: string[] | null;
  duration_min: number | null;
  scheduled_for: string;
  exercises: unknown;
}

type CoachExercise = {
  name?: string;
  sets?: number;
  reps?: string;
  suggested_weight_kg?: number;
  muscle_groups?: string[];
};

/** Convertit une séance générée par le Coach IA (sets=number, reps=string) en Template éditable. */
function plannedToTemplate(row: PlannedRow): Template {
  const raw = Array.isArray(row.exercises) ? (row.exercises as CoachExercise[]) : [];
  const exercises: WorkoutExercise[] = raw.map((e) => {
    const nSets = Math.max(1, Math.min(10, Number(e?.sets) || 3));
    const repsNum = parseInt(String(e?.reps ?? "8"), 10) || 8;
    const w = typeof e?.suggested_weight_kg === "number" ? e.suggested_weight_kg : 0;
    return {
      name: String(e?.name ?? "Exercice"),
      muscle_groups: Array.isArray(e?.muscle_groups) ? e.muscle_groups.map(String) : [],
      sets: Array.from({ length: nSets }, () => ({ reps: repsNum, weight_kg: w })),
    };
  });
  return {
    id: "planned",
    name: row.name ?? "Séance programmée",
    muscle_groups: row.muscle_groups ?? [],
    restSec: 90,
    exercises,
  };
}

function totalVolume(exercises: unknown): number {
  if (!Array.isArray(exercises)) return 0;
  let v = 0;
  for (const ex of exercises as WorkoutExercise[]) {
    for (const s of ex.sets ?? []) v += (s.reps || 0) * (s.weight_kg || 0);
  }
  return v;
}


/** Clone profond simple d'un template (assez pour éditions locales). */
function cloneTemplate(t: Template): Template {
  return {
    ...t,
    muscle_groups: [...t.muscle_groups],
    exercises: t.exercises.map((e) => ({
      ...e,
      muscle_groups: [...e.muscle_groups],
      sets: e.sets.map((s) => ({ ...s })),
    })),
  };
}

export default function Training({ onPR, refreshKey }: { onPR: () => void; refreshKey?: number }) {
  const [bestPRs, setBestPRs] = useState<Record<string, VerifiedPR>>({});
  const [bodyweight, setBodyweight] = useState<number | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [localTick, setLocalTick] = useState(0);

  // Séance du jour éditable — on part du template Push par défaut.
  const [session, setSession] = useState<Template>(() => cloneTemplate(TEMPLATES[0]));
  const [recentSessions, setRecentSessions] = useState<Array<{ muscle_groups: string[] | null; completed_at: string }>>([]);
  const [history, setHistory] = useState<WorkoutHistoryRow[]>([]);
  const [planned, setPlanned] = useState<PlannedRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

      const [profileRes, prsRes, sessionsRes, historyRes, plannedRes] = await Promise.all([
        supabase.rpc("get_my_profile").maybeSingle(),
        supabase
          .from("prs")
          .select("exercise, weight_kg, reps, created_at")
          .eq("user_id", user.id)
          .eq("status", "verified")
          .order("weight_kg", { ascending: false }),
        supabase
          .from("workout_sessions")
          .select("muscle_groups, completed_at")
          .eq("user_id", user.id)
          .gte("completed_at", since),
        supabase
          .from("workout_sessions")
          .select("id, name, muscle_groups, duration_min, completed_at, exercises")
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(20),
        supabase
          .from("workout_sessions")
          .select("id, name, muscle_groups, duration_min, scheduled_for, exercises")
          .eq("user_id", user.id)
          .is("completed_at", null)
          .not("scheduled_for", "is", null)
          .gte("scheduled_for", new Date().toISOString().slice(0, 10))
          .order("scheduled_for", { ascending: true })
          .limit(20),
      ]);

      if (cancelled) return;
      if ((profileRes.data as { poids?: number } | null)?.poids) {
        setBodyweight(Number((profileRes.data as { poids: number }).poids));
      }

      if (prsRes.data) {
        const bests: Record<string, VerifiedPR> = {};
        for (const pr of prsRes.data as VerifiedPR[]) {
          if (!bests[pr.exercise] || pr.weight_kg > bests[pr.exercise].weight_kg) {
            bests[pr.exercise] = pr;
          }
        }
        setBestPRs(bests);
      }

      if (sessionsRes.data) {
        setRecentSessions(
          (sessionsRes.data as Array<{ muscle_groups: string[] | null; completed_at: string }>) ?? [],
        );
      }

      if (historyRes.data) {
        setHistory(historyRes.data as WorkoutHistoryRow[]);
      }

      if (plannedRes.data) {
        setPlanned(plannedRes.data as PlannedRow[]);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, localTick]);

  const exerciseLabels: Record<string, string> = { squat: "Squat", bench: "Bench Press", deadlift: "Deadlift" };
  const hasPRs = Object.keys(bestPRs).length > 0;

  // Récupération par muscle (0-100%) — pilote la couleur feu tricolore du diagramme.
  const recovery = useMemo<MuscleRecovery>(() => {
    // Normalise les muscle_groups des sessions vers les clés canoniques.
    const normalized = recentSessions.map((s) => ({
      completed_at: s.completed_at,
      muscle_groups: (s.muscle_groups ?? []).map((g) => normalizeMuscle(g)),
    }));
    const states = computeRecovery(normalized);
    const out: MuscleRecovery = {};
    for (const st of states) {
      // On ne colore que les muscles réellement travaillés (avec un lastAt).
      if (st.lastAt) out[st.group as MuscleGroup] = st.percent;
    }
    return out;
  }, [recentSessions]);

  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
  const targetMuscles = Array.from(
    new Set(session.exercises.flatMap((e) => e.muscle_groups.map(normalizeMuscle))),
  );

  // ------- Session mutations --------
  const setExercises = (updater: (list: WorkoutExercise[]) => WorkoutExercise[]) => {
    setSession((s) => ({ ...s, exercises: updater(s.exercises) }));
  };

  const addSet = (exIdx: number) => {
    setExercises((list) => list.map((ex, i) => {
      if (i !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1] ?? { reps: 8, weight_kg: 0 };
      return { ...ex, sets: [...ex.sets, { ...last }] };
    }));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((list) => list.map((ex, i) => {
      if (i !== exIdx) return ex;
      if (ex.sets.length <= 1) return ex;
      return { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) };
    }));
  };

  const updateSet = (exIdx: number, setIdx: number, field: "reps" | "weight_kg", value: number) => {
    setExercises((list) => list.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)),
      };
    }));
  };

  const removeExercise = (exIdx: number) => {
    setExercises((list) => list.filter((_, i) => i !== exIdx));
  };

  const addExerciseFromLibrary = (ex: LibraryExercise) => {
    setExercises((list) => [
      ...list,
      {
        name: ex.name,
        muscle_groups: ex.muscles,
        sets: [
          { reps: 10, weight_kg: 0 },
          { reps: 10, weight_kg: 0 },
          { reps: 8, weight_kg: 0 },
        ],
      },
    ]);
    setLibraryOpen(false);
  };

  const switchTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) setSession(cloneTemplate(t));
  };

  const startEmptySession = () => {
    // Si on est déjà sur une séance custom non vide, ne pas effacer :
    // ouvrir simplement la bibliothèque pour ajouter un exercice de plus.
    if (session.id === "custom" && session.exercises.length > 0) {
      setLibraryOpen(true);
      return;
    }
    setSession({
      id: "custom",
      name: "Ma séance",
      muscle_groups: [],
      restSec: 90,
      exercises: [],
    });
    setLibraryOpen(true);
  };

  const startPlanned = async (row: PlannedRow) => {
    setSession(plannedToTemplate(row));
    // On supprime la ligne planifiée pour éviter les doublons ; la séance terminée sera resauvegardée par le WorkoutLogger.
    await supabase.from("workout_sessions").delete().eq("id", row.id);
    setPlanned((p) => p.filter((x) => x.id !== row.id));
    setWorkoutOpen(true);
  };

  const deletePlanned = async (id: string) => {
    if (!confirm("Supprimer cette séance programmée ?")) return;
    const prev = planned;
    setPlanned((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from("workout_sessions").delete().eq("id", id);
    if (error) setPlanned(prev);
  };


  return (
    <div className="px-4 pt-2 pb-6">
      {/* Actions rapides */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ActionCard icon={Camera} title="Log un PR" glow onClick={onPR} />
        <ActionCard icon={NotebookPen} title="Mon entraînement" onClick={() => setWorkoutOpen(true)} />
        <ActionCard icon={Target} title="Mes objectifs" onClick={() => setGoalOpen(true)} />
        <ActionCard icon={Sparkles} title="Coach IA" premium onClick={() => setCoachOpen(true)} />
      </div>

      {/* Diagramme corporel — couleurs = état de récup par muscle */}
      <BodyDiagram recovery={recovery} targets={targetMuscles} />

      {/* Séance du jour */}
      <div className="mt-5 flex items-center justify-between">
        <h3 className="text-xs font-black tracking-widest text-arena-muted">SÉANCE DU JOUR</h3>
        <button
          onClick={() => setLibraryOpen(true)}
          className="flex items-center gap-1 text-[11px] font-black text-arena"
        >
          <Library size={12} /> Bibliothèque
        </button>
      </div>

      <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          onClick={startEmptySession}
          className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-widest transition ${
            session.id === "custom"
              ? "border-arena-gold bg-arena-gold text-black"
              : "border-arena bg-arena/10 text-arena"
          }`}
        >
          + CRÉER UNE SÉANCE
        </button>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTemplate(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-widest transition ${
              session.id === t.id
                ? "border-arena-gold bg-arena-gold text-black"
                : "border-arena-border bg-arena-surface text-arena-sub"
            }`}
          >
            {t.id.toUpperCase()}
          </button>
        ))}
      </div>


      <p className="mt-2 text-[10px] text-arena-sub">
        {session.exercises.length} exos · {totalSets} séries · repos {session.restSec}s
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {session.exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={exIdx}
            ex={ex}
            onAddSet={() => addSet(exIdx)}
            onRemoveSet={(sIdx) => removeSet(exIdx, sIdx)}
            onUpdateSet={(sIdx, field, value) => updateSet(exIdx, sIdx, field, value)}
            onRemove={() => removeExercise(exIdx)}
          />
        ))}
        {session.exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-arena-border p-4 text-center">
            <p className="text-xs text-arena-muted">Ta séance est vide</p>
            <button
              onClick={() => setLibraryOpen(true)}
              className="mt-2 text-xs font-bold text-arena"
            >
              Ajouter un exercice
            </button>
          </div>
        )}
      </div>

      {/* Démarrer */}
      <button
        onClick={() => setWorkoutOpen(true)}
        disabled={session.exercises.length === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-arena-gold py-3.5 font-black tracking-widest text-black shadow-[0_0_24px_rgba(212,175,55,0.35)] disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition"
      >
        <Play size={16} strokeWidth={3} /> DÉMARRER LA SÉANCE
      </button>

      <CoachSheet
        open={coachOpen}
        onOpenChange={setCoachOpen}
        onSessionStarted={() => setLocalTick((k) => k + 1)}
      />
      <WorkoutLogger
        open={workoutOpen}
        onOpenChange={setWorkoutOpen}
        onCompleted={() => setLocalTick((k) => k + 1)}
        sessionOverride={session}
      />
      <GoalEditor open={goalOpen} onOpenChange={setGoalOpen} onSaved={() => setLocalTick((k) => k + 1)} />
      <ExerciseLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onAdd={addExerciseFromLibrary}
      />

      <SectionTitle>TES PR ACTUELS</SectionTitle>
      {hasPRs ? (
        <div className="flex flex-col gap-3">
          {(["squat", "bench", "deadlift"] as const).map((ex) => {
            const pr = bestPRs[ex];
            if (!pr) return null;
            const ratio = bodyweight ? (pr.weight_kg / bodyweight).toFixed(2) : null;
            return (
              <div key={ex} className="flex items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-4">
                <div>
                  <p className="font-black text-foreground">{exerciseLabels[ex]}</p>
                  {ratio && <p className="text-xs text-arena-sub">Ratio {ratio}× BW</p>}
                </div>
                <span className="text-xl font-black text-arena">{pr.weight_kg}kg</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-arena-border bg-arena-surface p-4 text-center">
          <p className="text-sm text-arena-muted">Aucun PR enregistré</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-arena-sub">
            Log ton premier PR pour commencer <Trophy size={12} className="text-arena" />
          </p>
        </div>
      )}

      {planned.length > 0 && (
        <>
          <SectionTitle>SÉANCES PROGRAMMÉES</SectionTitle>
          <ul className="mb-4 flex flex-col gap-2">
            {planned.map((p) => {
              const d = new Date(p.scheduled_for + "T00:00:00");
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isToday = d.getTime() === today.getTime();
              const label = isToday
                ? "Aujourd'hui"
                : d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "short" });
              const nbEx = Array.isArray(p.exercises) ? p.exercises.length : 0;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-3"
                >
                  <CalendarClock size={18} className="text-arena flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-black text-foreground truncate">{p.name ?? "Séance"}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-arena whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                    <p className="text-[11px] text-arena-sub">
                      {nbEx} exos
                      {p.duration_min ? ` · ${p.duration_min} min` : ""}
                      {p.muscle_groups && p.muscle_groups.length > 0
                        ? ` · ${p.muscle_groups.slice(0, 3).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => startPlanned(p)}
                    aria-label="Démarrer"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-arena text-arena-on active:scale-95"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={() => deletePlanned(p.id)}
                    aria-label="Supprimer"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-arena-border text-arena-muted active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <SectionTitle>HISTORIQUE DES SÉANCES</SectionTitle>
      {history.length === 0 ? (
        <div className="rounded-2xl border border-arena-border bg-arena-surface p-4 text-center">
          <p className="text-sm text-arena-muted">Aucune séance terminée</p>
          <p className="mt-1 text-xs text-arena-sub">Termine une séance pour la voir ici.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {history.map((h) => {
            const vol = Math.round(totalVolume(h.exercises));
            const nbEx = Array.isArray(h.exercises) ? h.exercises.length : 0;
            const d = new Date(h.completed_at);
            return (
              <li
                key={h.id}
                className="rounded-2xl border border-arena-border bg-arena-surface p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-black text-foreground truncate">
                    {h.name ?? "Séance"}
                  </p>
                  <span className="text-[10px] font-bold text-arena-muted whitespace-nowrap">
                    {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-arena-sub">
                  <span>{nbEx} exos</span>
                  {vol > 0 && <span>· {vol.toLocaleString("fr-FR")} kg volume</span>}
                  {h.duration_min ? <span>· {h.duration_min} min</span> : null}
                </div>
                {h.muscle_groups && h.muscle_groups.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {h.muscle_groups.slice(0, 5).map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-arena-border bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-arena-sub"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* --------- Sub components --------- */

function ExerciseCard({
  ex,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemove,
}: {
  ex: WorkoutExercise;
  onAddSet: () => void;
  onRemoveSet: (setIdx: number) => void;
  onUpdateSet: (setIdx: number, field: "reps" | "weight_kg", value: number) => void;
  onRemove: () => void;
}) {
  const img = imageForExerciseName(ex.name);
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {img ? (
            <img
              src={img}
              alt={ex.name}
              loading="lazy"
              className="h-11 w-11 shrink-0 rounded-xl object-cover border border-arena-border bg-black"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-arena-gold/10">
              <Dumbbell size={18} className="text-arena-gold" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-black text-foreground truncate">{ex.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {ex.muscle_groups.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-arena-border bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-arena-sub"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-arena-border text-arena-muted active:scale-90 transition"
          aria-label="Retirer l'exercice"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="grid grid-cols-[24px_1fr_1fr_24px] gap-2 text-[9px] font-black tracking-widest text-arena-muted">
          <span>#</span>
          <span>REPS</span>
          <span>KG</span>
          <span />
        </div>
        {ex.sets.map((s, i) => (
          <div key={i} className="grid grid-cols-[24px_1fr_1fr_24px] items-center gap-2">
            <span className="text-xs font-black text-arena-sub">{i + 1}</span>
            <NumberInput
              value={s.reps}
              onChange={(v) => onUpdateSet(i, "reps", v)}
              min={1}
              max={99}
            />
            <NumberInput
              value={s.weight_kg}
              onChange={(v) => onUpdateSet(i, "weight_kg", v)}
              step={2.5}
              min={0}
              max={500}
            />
            <button
              onClick={() => onRemoveSet(i)}
              disabled={ex.sets.length <= 1}
              className="flex h-6 w-6 items-center justify-center rounded-md text-arena-muted disabled:opacity-30 active:scale-90 transition"
              aria-label="Retirer la série"
            >
              <Minus size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAddSet}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-arena-border py-2 text-[11px] font-black tracking-widest text-arena-sub active:scale-[0.98] transition"
      >
        <Plus size={12} /> AJOUTER UNE SÉRIE
      </button>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
      }}
      className="w-full rounded-lg border border-arena-border bg-secondary px-2 py-1 text-center text-sm font-black text-foreground focus:border-arena focus:outline-none"
    />
  );
}

function ActionCard({ icon: Icon, title, glow, premium, onClick }: { icon: React.ElementType; title: string; glow?: boolean; premium?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-4 active:scale-95 transition-transform ${glow ? "shadow-[0_0_20px_var(--arena-glow)]" : ""}`}
    >
      {premium && <PremiumBadge className="absolute right-1.5 top-1.5" />}
      <Icon size={22} className={glow ? "text-arena" : "text-arena-sub"} />
      <span className="text-xs font-bold text-foreground">{title}</span>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">{children}</h3>;
}
