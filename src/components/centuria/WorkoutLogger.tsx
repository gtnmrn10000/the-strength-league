import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Check, Timer, ChevronRight, Dumbbell, Trophy, Loader2, Plus, X, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TEMPLATES, type Template, type WorkoutExercise } from "@/lib/workoutTemplates";
import { imageForExerciseName, type LibraryExercise } from "@/lib/exerciseCatalog";
import {
  fetchLastPerformances,
  lastPerfFor,
  pushRecentId,
  type LastPerf,
} from "@/lib/exerciseUserData";
import ExerciseLibrary from "./ExerciseLibrary";

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

/** Préremplit les charges/reps à partir des dernières perfs réelles. */
function applyLastPerfs(t: Template, perfs: Record<string, LastPerf>): Template {
  return {
    ...t,
    exercises: t.exercises.map((ex) => {
      const p = lastPerfFor(perfs, ex.name);
      if (!p) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => ({
          reps: s.reps || p.reps,
          weight_kg: s.weight_kg || p.weight_kg,
        })),
      };
    }),
  };
}

export default function WorkoutLogger({
  open,
  onOpenChange,
  onCompleted,
  sessionOverride,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: () => void;
  sessionOverride?: Template | null;
}) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [perfs, setPerfs] = useState<Record<string, LastPerf>>({});
  const [libOpen, setLibOpen] = useState(false);
  const perfsLoaded = useRef(false);

  useEffect(() => {
    if (!open) {
      setTemplate(null);
      setDone({});
      setRestEndsAt(null);
      setStartedAt(null);
      perfsLoaded.current = false;
      return;
    }
    void (async () => {
      const p = await fetchLastPerformances();
      perfsLoaded.current = true;
      setPerfs(p);
      setTemplate((t) => (t ? applyLastPerfs(t, p) : t));
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !sessionOverride) return;
    setTemplate(applyLastPerfs(cloneTemplate(sessionOverride), perfs));
    setStartedAt(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionOverride]);

  useEffect(() => {
    if (!restEndsAt) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [restEndsAt]);

  const totalSets = useMemo(
    () => template?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0,
    [template],
  );
  const doneCount = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const progressPct = totalSets ? Math.round((doneCount / totalSets) * 100) : 0;
  const allDone = totalSets > 0 && doneCount === totalSets;

  const mutate = (fn: (list: WorkoutExercise[]) => WorkoutExercise[]) =>
    setTemplate((t) => (t ? { ...t, exercises: fn(t.exercises) } : t));

  const toggleSet = (exIdx: number, setIdx: number) => {
    const key = `${exIdx}-${setIdx}`;
    const wasDone = done[key];
    setDone((d) => ({ ...d, [key]: !d[key] }));
    if (!wasDone && template) setRestEndsAt(Date.now() + template.restSec * 1000);
  };

  const updateSet = (exIdx: number, setIdx: number, field: "reps" | "weight_kg", value: number) =>
    mutate((list) =>
      list.map((ex, i) =>
        i !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) },
      ),
    );

  const addSet = (exIdx: number) =>
    mutate((list) =>
      list.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1] ?? { reps: 10, weight_kg: 0 };
        return { ...ex, sets: [...ex.sets, { ...last }] };
      }),
    );

  const removeExercise = (exIdx: number) => {
    mutate((list) => list.filter((_, i) => i !== exIdx));
    setDone((d) => {
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(d)) {
        const [e, s] = k.split("-").map(Number);
        if (e === exIdx) continue;
        next[`${e > exIdx ? e - 1 : e}-${s}`] = v;
      }
      return next;
    });
  };

  const addExercise = (lib: LibraryExercise) => {
    const p = lastPerfFor(perfs, lib.name);
    pushRecentId(lib.id);
    mutate((list) => [
      ...list,
      {
        name: lib.name,
        muscle_groups: lib.muscles,
        sets: Array.from({ length: 3 }, () => ({
          reps: p?.reps || 10,
          weight_kg: p?.weight_kg || 0,
        })),
      },
    ]);
    setLibOpen(false);
  };

  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;

  const finish = async () => {
    if (!template || saving) return;
    if (!allDone && totalSets > 0) {
      const ok = window.confirm(
        `Terminer la séance avec ${doneCount}/${totalSets} séries validées ?`,
      );
      if (!ok) return;
    }
    setSaving(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const user = userData?.user;
      if (userErr || !user) {
        throw new Error("Session expirée. Reconnecte-toi pour enregistrer ta séance.");
      }

      const durationMin = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : null;

      // On enregistre les valeurs réellement saisies : séries cochées en priorité,
      // sinon l'exercice tel qu'édité (jamais le template d'origine).
      const savedExercises = template.exercises.map((ex, exIdx) => {
        const doneSets = ex.sets.filter((_, i) => done[`${exIdx}-${i}`]);
        return { ...ex, sets: doneSets.length ? doneSets : ex.sets };
      });

      const payload = {
        user_id: user.id,
        name: template.name,
        exercises: savedExercises as unknown as import("@/integrations/supabase/types").Json,
        muscle_groups: template.muscle_groups ?? [],
        duration_min: durationMin,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("workout_sessions").insert([payload]);
      if (error) throw error;

      toast.success("Séance enregistrée");
      onCompleted?.();
      onOpenChange(false);
    } catch (e) {
      console.error("[WorkoutLogger] finish failed:", e);
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Impossible d'enregistrer la séance";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col overflow-hidden bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            {template ? "SÉANCE EN COURS" : "CHOISIS TA SÉANCE"}
          </SheetTitle>
        </SheetHeader>

        {!template ? (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <p className="text-xs text-arena-sub">Choisis une séance : tout reste modifiable.</p>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplate(applyLastPerfs(cloneTemplate(t), perfs));
                  setStartedAt(Date.now());
                }}
                className="flex min-h-[56px] items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-4 text-left transition active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-foreground">{t.name}</p>
                  <p className="mt-1 text-[10px] text-arena-sub">
                    {t.exercises.length} exos ·{" "}
                    {t.exercises.reduce((s, e) => s + e.sets.length, 0)} séries · repos {t.restSec}s
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-arena" />
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-arena-muted">
                <span>
                  {doneCount} / {totalSets} séries
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-arena-gold"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-4 py-3 pb-24">
              {template.exercises.map((ex, exIdx) => {
                const perf = lastPerfFor(perfs, ex.name);
                const exDone = ex.sets.filter((_, i) => done[`${exIdx}-${i}`]).length;
                const img = imageForExerciseName(ex.name);
                return (
                  <div
                    key={`${ex.name}-${exIdx}`}
                    className={`rounded-2xl border p-3 transition ${
                      exDone === ex.sets.length
                        ? "border-arena-gold/50 bg-arena-gold/5"
                        : "border-arena-border bg-arena-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          loading="lazy"
                          className="h-9 w-9 shrink-0 rounded-lg border border-arena-border bg-black object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-arena-gold/10">
                          <Dumbbell size={16} className="text-arena-gold" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-foreground">{ex.name}</p>
                        <p className="truncate text-[10px] text-arena-sub">
                          {perf
                            ? `Dernière fois : ${perf.weight_kg} kg × ${perf.reps}`
                            : "Première fois sur cet exercice"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-arena-muted">
                        {exDone}/{ex.sets.length}
                      </span>
                      <button
                        onClick={() => removeExercise(exIdx)}
                        aria-label={`Retirer ${ex.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-arena-border text-arena-muted active:scale-90"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-[28px_1fr_1fr_44px] gap-1.5 text-[9px] font-black tracking-widest text-arena-muted">
                      <span>SÉR.</span>
                      <span className="text-center">KG</span>
                      <span className="text-center">REPS</span>
                      <span />
                    </div>

                    {ex.sets.map((s, i) => {
                      const key = `${exIdx}-${i}`;
                      const isDone = done[key];
                      return (
                        <div key={i} className="mt-1.5 grid grid-cols-[28px_1fr_1fr_44px] items-center gap-1.5">
                          <span className="text-xs font-black text-arena-sub">{i + 1}</span>
                          <NumberField
                            value={s.weight_kg}
                            step={2.5}
                            max={500}
                            onChange={(v) => updateSet(exIdx, i, "weight_kg", v)}
                          />
                          <NumberField
                            value={s.reps}
                            step={1}
                            max={99}
                            onChange={(v) => updateSet(exIdx, i, "reps", v)}
                          />
                          <button
                            onClick={() => toggleSet(exIdx, i)}
                            aria-label={`Valider la série ${i + 1}`}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-90 ${
                              isDone
                                ? "border-arena-gold bg-arena-gold text-black"
                                : "border-arena-border bg-secondary text-arena-muted"
                            }`}
                          >
                            <Check size={18} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => addSet(exIdx)}
                      className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-1 rounded-xl border border-dashed border-arena-border text-[11px] font-black tracking-widest text-arena-sub active:scale-[0.98]"
                    >
                      <Plus size={12} /> AJOUTER UNE SÉRIE
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => setLibOpen(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-arena/50 bg-arena/10 font-black tracking-widest text-arena active:scale-[0.98]"
              >
                <Library size={15} /> AJOUTER UN EXERCICE
              </button>
            </div>

            {/* Timer de repos sticky — ne bloque pas l'écran */}
            <AnimatePresence>
              {restLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="pointer-events-auto absolute inset-x-3 bottom-[76px] z-20 flex items-center gap-2 rounded-2xl border border-arena-gold/50 bg-black/90 px-3 py-2 backdrop-blur"
                >
                  <Timer size={16} className="shrink-0 text-arena-gold" />
                  <span className="flex-1 text-sm font-black text-arena-gold">
                    Repos {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setRestEndsAt((t) => (t ?? Date.now()) + 30000)}
                    className="min-h-[36px] rounded-lg border border-arena-gold/50 px-2.5 text-[11px] font-black text-arena-gold active:scale-95"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => setRestEndsAt(null)}
                    className="min-h-[36px] rounded-lg px-2.5 text-[11px] font-black text-arena-muted active:scale-95"
                  >
                    PASSER
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-arena-border p-3">
              <button
                onClick={finish}
                disabled={saving}
                className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl font-black tracking-widest transition disabled:opacity-40 ${
                  allDone
                    ? "bg-arena-gold text-black shadow-[0_0_24px_rgba(212,175,55,0.35)]"
                    : "bg-arena text-arena-on"
                }`}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trophy size={16} />
                    {allDone ? "TERMINER LA SÉANCE" : `TERMINER (${doneCount}/${totalSets})`}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        <ExerciseLibrary open={libOpen} onOpenChange={setLibOpen} onAdd={addExercise} />
      </SheetContent>
    </Sheet>
  );
}

function NumberField({
  value,
  onChange,
  max = 999,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(Math.max(0, Math.min(max, n)));
      }}
      onFocus={(e) => e.currentTarget.select()}
      className="h-11 w-full rounded-xl border border-arena-border bg-secondary px-1 text-center text-base font-black text-foreground focus:border-arena focus:outline-none"
    />
  );
}
