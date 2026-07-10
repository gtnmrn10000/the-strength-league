import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Check, Timer, ChevronRight, Dumbbell, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TEMPLATES, type Template } from "@/lib/workoutTemplates";

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

  useEffect(() => {
    if (!open) {
      setTemplate(null);
      setDone({});
      setRestEndsAt(null);
      setStartedAt(null);
      return;
    }
    if (sessionOverride) {
      setTemplate(sessionOverride);
      setStartedAt(Date.now());
    }
  }, [open, sessionOverride]);

  useEffect(() => {
    if (!restEndsAt) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [restEndsAt]);

  const totalSets = useMemo(
    () => template?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0,
    [template]
  );
  const doneCount = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const progressPct = totalSets ? Math.round((doneCount / totalSets) * 100) : 0;
  const allDone = totalSets > 0 && doneCount === totalSets;

  const toggleSet = (key: string) => {
    if (done[key]) return; // one-way validation
    setDone((d) => ({ ...d, [key]: true }));
    if (template) setRestEndsAt(Date.now() + template.restSec * 1000);
  };

  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;

  const finish = async () => {
    if (!template || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const durationMin = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : null;

      const { error } = await supabase.from("workout_sessions").insert([{
        user_id: user.id,
        name: template.name,
        exercises: template.exercises as unknown as import("@/integrations/supabase/types").Json,
        muscle_groups: template.muscle_groups,
        duration_min: durationMin,
        completed_at: new Date().toISOString(),
      }]);
      if (error) throw error;

      toast.success("Séance enregistrée 💪");
      onCompleted?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer la séance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            {template ? "SÉANCE EN COURS" : "CHOISIS TA SÉANCE"}
          </SheetTitle>
        </SheetHeader>

        {!template ? (
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            <p className="text-xs text-arena-sub">
              Sélectionne un template. Tu pourras enchaîner les séries au tap.
            </p>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplate(t);
                  setStartedAt(Date.now());
                }}
                className="flex items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-4 text-left active:scale-[0.98] transition"
              >
                <div>
                  <p className="font-black text-foreground">{t.name}</p>
                  <p className="mt-1 text-[10px] text-arena-sub">
                    {t.exercises.length} exos ·{" "}
                    {t.exercises.reduce((s, e) => s + e.sets.length, 0)} séries · repos {t.restSec}s
                  </p>
                </div>
                <ChevronRight size={18} className="text-arena" />
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-arena-muted">
                <span>{doneCount} / {totalSets} séries</span>
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

            {/* Rest hint */}
            <AnimatePresence>
              {restLeft > 0 && !allDone && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-arena-gold/40 bg-arena-gold/10 px-3 py-2"
                >
                  <Timer size={14} className="text-arena-gold" />
                  <span className="text-xs font-bold text-arena-gold">
                    Repos conseillé : {restLeft}s
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {template.exercises.map((ex, exIdx) => {
                const exDoneCount = ex.sets.filter((_, i) => done[`${exIdx}-${i}`]).length;
                const exAllDone = exDoneCount === ex.sets.length;
                return (
                  <div
                    key={exIdx}
                    className={`rounded-2xl border p-4 transition ${
                      exAllDone
                        ? "border-arena-gold/50 bg-arena-gold/5"
                        : "border-arena-border bg-arena-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell size={16} className="text-arena" />
                        <p className="font-black text-foreground">{ex.name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-arena-muted">
                        {exDoneCount}/{ex.sets.length}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {ex.sets.map((s, i) => {
                        const key = `${exIdx}-${i}`;
                        const isDone = done[key];
                        return (
                          <button
                            key={i}
                            onClick={() => toggleSet(key)}
                            className={`relative flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95 ${
                              isDone
                                ? "border-arena-gold bg-arena-gold/15"
                                : "border-arena-border bg-secondary"
                            }`}
                          >
                            <div>
                              <p className="text-[10px] font-bold text-arena-muted">Série {i + 1}</p>
                              <p className="text-sm font-black text-foreground">
                                {s.reps} × {s.weight_kg}kg
                              </p>
                            </div>
                            <AnimatePresence>
                              {isDone && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-arena-gold"
                                >
                                  <Check size={14} className="text-black" strokeWidth={3} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-arena-border p-3">
              <button
                onClick={finish}
                disabled={saving}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black tracking-widest transition ${
                  allDone
                    ? "bg-arena-gold text-black"
                    : "bg-arena-surface text-arena-sub border border-arena-border"
                }`}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : allDone ? (
                  <>
                    <Trophy size={16} /> TERMINER LA SÉANCE
                  </>
                ) : (
                  "SÉANCE EN COURS…"
                )}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
