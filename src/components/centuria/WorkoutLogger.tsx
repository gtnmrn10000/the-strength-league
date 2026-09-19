import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Check,
  Timer,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Dumbbell,
  Loader2,
  Plus,
  X,
  Library,
  Repeat,
} from "lucide-react";
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
import { fetchProgress, statsFor } from "@/lib/progress";
import { awardWorkoutXp } from "@/lib/api";
import { queueSession } from "@/lib/offlineSync";
import { pushBackHandler } from "@/lib/backButton";
import { ACTIVE_SESSION_KEY } from "@/lib/activeSession";
import { track } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import ExerciseLibrary from "./ExerciseLibrary";
import SessionSummary, { type NewRecord, type SessionResult } from "./session/SessionSummary";

const DRAFT_KEY = ACTIVE_SESSION_KEY;

/** Détecte une erreur réseau/hors-ligne (par opposition à une erreur métier/auth). */
function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message).toLowerCase()
      : "";
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed")
  );
}

type Draft = {
  id: string;
  template: Template;
  done: Record<string, boolean>;
  startedAt: number;
  restEndsAt: number | null;
};

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!d?.template?.exercises) return null;
    return { ...d, id: d.id ?? crypto.randomUUID(), restEndsAt: d.restEndsAt ?? null };
  } catch {
    return null;
  }
}

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [perfs, setPerfs] = useState<Record<string, LastPerf>>({});
  const [libOpen, setLibOpen] = useState(false);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const perfsLoaded = useRef(false);

  // Reprise : une séance en cours survit à un changement d'onglet, à une mise en
  // arrière-plan et à un plantage/redémarrage de l'app. Le brouillon a TOUJOURS
  // la priorité sur le modèle proposé : on ne réinitialise jamais une séance
  // commencée.
  useEffect(() => {
    if (!open) {
      setRestEndsAt(null);
      perfsLoaded.current = false;
      return;
    }
    setResult(null);
    const draft = readDraft();
    if (draft) {
      setTemplate(draft.template);
      setDone(draft.done ?? {});
      setStartedAt(draft.startedAt ?? Date.now());
      setSessionId(draft.id);
      setRestEndsAt(draft.restEndsAt ?? null);
      track("workout_resumed", {});
    } else if (sessionOverride) {
      setTemplate(applyLastPerfs(cloneTemplate(sessionOverride), perfs));
      setDone({});
      setStartedAt(Date.now());
      setSessionId(crypto.randomUUID());
      setRestEndsAt(null);
      track("workout_started", { source: "template" });
    } else {
      track("workout_started", { source: "template" });
    }
    void (async () => {
      const p = await fetchLastPerformances();
      perfsLoaded.current = true;
      setPerfs(p);
      if (!draft) setTemplate((t) => (t ? applyLastPerfs(t, p) : t));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sauvegarde du brouillon à chaque changement — débounce léger (<=300ms)
  // mais toujours suivi d'un flush synchrone à la fermeture/mise en arrière-plan
  // pour ne jamais perdre la dernière saisie (kg/reps/séries/repos/ordre...).
  const draftRef = useRef<Draft | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushDraft = useCallback(() => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    if (!draftRef.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current));
    } catch {
      /* quota — sans gravité */
    }
  }, []);

  useEffect(() => {
    if (!template || !startedAt || !sessionId || result) return;
    draftRef.current = { id: sessionId, template, done, startedAt, restEndsAt };
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(flushDraft, 250);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [template, done, startedAt, sessionId, restEndsAt, result, flushDraft]);

  useEffect(() => {
    const onVisibility = () => flushDraft();
    const onPageHide = () => flushDraft();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [flushDraft]);

  const clearDraft = useCallback(() => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    draftRef.current = null;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
  }, []);

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

  /** Réindexe la map des séries validées après un déplacement/suppression. */
  const remapDone = (map: (exIdx: number) => number | null) =>
    setDone((d) => {
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(d)) {
        const [e, s] = k.split("-").map(Number);
        const target = map(e);
        if (target === null) continue;
        next[`${target}-${s}`] = v;
      }
      return next;
    });

  const removeExercise = (exIdx: number) => {
    mutate((list) => list.filter((_, i) => i !== exIdx));
    remapDone((e) => (e === exIdx ? null : e > exIdx ? e - 1 : e));
  };

  const moveExercise = (exIdx: number, dir: -1 | 1) => {
    const target = exIdx + dir;
    if (!template || target < 0 || target >= template.exercises.length) return;
    mutate((list) => {
      const next = [...list];
      const [moved] = next.splice(exIdx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    remapDone((e) => (e === exIdx ? target : e === target ? exIdx : e));
  };

  const addExercise = (lib: LibraryExercise) => {
    const p = lastPerfFor(perfs, lib.name);
    pushRecentId(lib.id);
    const fresh: WorkoutExercise = {
      name: lib.name,
      muscle_groups: lib.muscles,
      sets: Array.from({ length: 3 }, () => ({
        reps: p?.reps || 10,
        weight_kg: p?.weight_kg || 0,
      })),
    };
    if (replaceIdx !== null) {
      const idx = replaceIdx;
      mutate((list) => list.map((ex, i) => (i === idx ? fresh : ex)));
      remapDone((e) => (e === idx ? null : e));
      setReplaceIdx(null);
    } else {
      mutate((list) => [...list, fresh]);
    }
    track("exercise_added", { name: lib.id });
    setLibOpen(false);
  };

  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;

  const requestFinish = () => {
    if (!template || saving) return;
    if (!allDone && totalSets > 0) {
      setConfirmFinish(true);
      return;
    }
    void save();
  };

  const save = async () => {
    if (!template || saving) return;
    // Sécurité : une séance doit toujours avoir un id client stable (retry-safe).
    const sid = sessionId ?? crypto.randomUUID();
    if (!sessionId) setSessionId(sid);
    setConfirmFinish(false);
    setSaving(true);
    try {
      // Identité : on utilise l'utilisateur déjà en mémoire (contexte auth).
      // Aucun appel réseau ici, sinon la fin de séance se bloque hors connexion.
      const user = authUser;
      if (!user) {
        throw new Error("Session expirée. Reconnecte-toi pour enregistrer ta séance.");
      }

      const durationMin = startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt) / 60000))
        : null;

      // On enregistre uniquement les séries réellement validées dès qu'il y en a
      // au moins une : jamais de séries non faites (stats et records honnêtes).
      const savedExercises = doneCount
        ? template.exercises
            .map((ex, exIdx) => ({
              ...ex,
              sets: ex.sets.filter((_, i) => done[`${exIdx}-${i}`]),
            }))
            .filter((ex) => ex.sets.length > 0)
        : template.exercises;

      // Records : on compare aux meilleures charges connues AVANT l'insertion.
      // Hors ligne, l'historique distant n'est pas joignable : on saute cet appel
      // (les records seront recalculés à la synchronisation).
      const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
      const before = isOffline ? null : await fetchProgress(120).catch(() => null);
      const records: NewRecord[] = [];
      let sets = 0;
      let volume = 0;
      for (const ex of savedExercises) {
        let top = { weight_kg: 0, reps: 0 };
        for (const s of ex.sets) {
          sets += 1;
          volume += (s.weight_kg ?? 0) * (s.reps ?? 0);
          if ((s.weight_kg ?? 0) > top.weight_kg) top = { weight_kg: s.weight_kg, reps: s.reps };
        }
        const prev = before ? (statsFor(before, ex.name)?.bestWeight?.weight_kg ?? 0) : null;
        if (prev !== null && top.weight_kg > 0 && top.weight_kg > prev) {
          records.push({ name: ex.name, weight_kg: top.weight_kg, reps: top.reps });
        }
      }

      const payload = {
        id: sid,
        user_id: user.id,
        name: template.name,
        exercises: savedExercises as unknown as import("@/integrations/supabase/types").Json,
        muscle_groups: template.muscle_groups ?? [],
        duration_min: durationMin,
        completed_at: new Date().toISOString(),
      };

      // Hors-ligne : on met la séance en file d'attente sans tenter le réseau,
      // pour ne jamais perdre les kg/reps saisis.
      if (isOffline) {
        track("workout_sync_failed", { reason: "offline" });
        queueSession(payload);
        clearDraft();
        setResult({
          template,
          durationMin,
          exercises: savedExercises.length,
          sets,
          volume,
          records,
          pendingSync: true,
        });
        onCompleted?.();
        return;
      }

      let inserted: { id: string } | null = null;
      try {
        // upsert sur id (clé cliente générée au démarrage) : un retry après
        // coupure ou crash ne peut jamais créer une seconde ligne.
        const { data, error } = await supabase
          .from("workout_sessions")
          .upsert([payload], { onConflict: "id", ignoreDuplicates: false })
          .select("id")
          .single();
        if (error) throw error;
        inserted = data;
      } catch (e) {
        if (isNetworkError(e)) {
          track("workout_sync_failed", { reason: "network" });
          queueSession(payload);
          clearDraft();
          setResult({
            template,
            durationMin,
            exercises: savedExercises.length,
            sets,
            volume,
            records,
            pendingSync: true,
          });
          onCompleted?.();
          return;
        }
        throw e;
      }

      let xpGained: number | undefined;
      try {
        if (inserted?.id) {
          const xp = await awardWorkoutXp(inserted.id);
          xpGained = xp?.gained;
          if (xp?.leveledUp) {
            track("grade_unlocked", { grade: xp.grade, previous_grade: xp.previousGrade });
          }
        }
      } catch (e) {
        console.warn("[WorkoutLogger] xp award skipped", e);
      }

      clearDraft();
      track("workout_completed", {
        exercises: savedExercises.length,
        sets,
        duration_min: durationMin,
        records: records.length,
      });
      setResult({
        template,
        durationMin,
        exercises: savedExercises.length,
        sets,
        volume,
        records,
        xpGained,
      });
      onCompleted?.();
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

  const closeSheet = () => {
    setTemplate(null);
    setDone({});
    setStartedAt(null);
    setSessionId(null);
    setResult(null);
    onOpenChange(false);
  };

  // Bouton retour matériel : tant que la feuille est ouverte, on la
  // referme (avec la même logique de confirmation) plutôt que de laisser
  // remonter l'événement au niveau des onglets.
  useEffect(() => {
    if (!open) return;
    return pushBackHandler(() => {
      requestClose(false);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result, template, doneCount]);

  const requestClose = (next: boolean) => {
    if (next) return;
    if (result) {
      closeSheet();
      return;
    }
    if (template && doneCount > 0) {
      setConfirmAbandon(true);
      return;
    }
    if (template) {
      clearDraft();
    }
    closeSheet();
  };

  return (
    <Sheet open={open} onOpenChange={requestClose}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col overflow-hidden bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-wide text-foreground">
            {result ? "Séance terminée" : template ? "Séance en cours" : "Choisis ta séance"}
          </SheetTitle>
        </SheetHeader>

        {result ? (
          <SessionSummary result={result} onClose={closeSheet} />
        ) : !template ? (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <p className="text-xs text-arena-sub">Choisis une séance : tout reste modifiable.</p>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplate(applyLastPerfs(cloneTemplate(t), perfs));
                  setDone({});
                  setStartedAt(Date.now());
                  setSessionId(crypto.randomUUID());
                  setRestEndsAt(null);
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
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-4 py-3 pb-28">
              {template.exercises.map((ex, exIdx) => {
                const perf = lastPerfFor(perfs, ex.name);
                const exDone = ex.sets.filter((_, i) => done[`${exIdx}-${i}`]).length;
                const img = imageForExerciseName(ex.name);
                return (
                  <div
                    key={`${ex.name}-${exIdx}`}
                    className={`rounded-2xl border p-3 transition ${
                      exDone === ex.sets.length
                        ? "border-arena-gold/40 bg-arena-gold/[0.04]"
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
                    </div>

                    <div className="mt-3 grid grid-cols-[22px_1fr_1fr_44px] gap-1.5 text-[9px] font-bold tracking-wide text-arena-muted">
                      <span>Sér</span>
                      <span className="text-center">kg</span>
                      <span className="text-center">reps</span>
                      <span />
                    </div>

                    {ex.sets.map((s, i) => {
                      const key = `${exIdx}-${i}`;
                      const isDone = done[key];
                      return (
                        <div
                          key={i}
                          className="mt-1.5 grid grid-cols-[22px_1fr_1fr_44px] items-center gap-1.5"
                        >
                          <span className="text-xs font-black text-arena-sub">{i + 1}</span>
                          <NumberField
                            value={s.weight_kg}
                            step={2.5}
                            max={500}
                            placeholder={perf ? String(perf.weight_kg) : undefined}
                            onChange={(v) => updateSet(exIdx, i, "weight_kg", v)}
                          />
                          <NumberField
                            value={s.reps}
                            step={1}
                            max={99}
                            placeholder={perf ? String(perf.reps) : undefined}
                            onChange={(v) => updateSet(exIdx, i, "reps", v)}
                          />
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => toggleSet(exIdx, i)}
                            aria-label={`Valider la série ${i + 1}`}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                              isDone
                                ? "border-arena-gold bg-arena-gold text-black"
                                : "border-arena-border bg-secondary text-arena-muted"
                            }`}
                          >
                            <Check size={18} strokeWidth={3} />
                          </motion.button>
                        </div>
                      );
                    })}

                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        onClick={() => addSet(exIdx)}
                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-xl border border-dashed border-arena-border text-[11px] font-bold text-arena-sub active:scale-[0.98]"
                      >
                        <Plus size={12} /> Série
                      </button>
                      <IconBtn
                        label={`Monter ${ex.name}`}
                        disabled={exIdx === 0}
                        onClick={() => moveExercise(exIdx, -1)}
                      >
                        <ChevronUp size={14} />
                      </IconBtn>
                      <IconBtn
                        label={`Descendre ${ex.name}`}
                        disabled={exIdx === template.exercises.length - 1}
                        onClick={() => moveExercise(exIdx, 1)}
                      >
                        <ChevronDown size={14} />
                      </IconBtn>
                      <IconBtn
                        label={`Remplacer ${ex.name}`}
                        onClick={() => {
                          setReplaceIdx(exIdx);
                          setLibOpen(true);
                        }}
                      >
                        <Repeat size={14} />
                      </IconBtn>
                      <IconBtn label={`Retirer ${ex.name}`} onClick={() => removeExercise(exIdx)}>
                        <X size={14} />
                      </IconBtn>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => {
                  setReplaceIdx(null);
                  setLibOpen(true);
                }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-arena/40 bg-arena/10 font-bold text-arena active:scale-[0.98]"
              >
                <Library size={15} /> Ajouter un exercice
              </button>
            </div>

            {/* Timer de repos sticky — ne bloque pas l'écran */}
            <AnimatePresence>
              {restLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="pointer-events-auto absolute inset-x-3 bottom-[calc(80px+env(safe-area-inset-bottom))] z-20 flex items-center gap-2 rounded-2xl border border-arena-gold/40 bg-black/90 px-3 py-2 backdrop-blur"
                >
                  <Timer size={16} className="shrink-0 text-arena-gold" />
                  <span className="flex-1 text-sm font-black text-arena-gold">
                    Repos {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setRestEndsAt((t) => (t ?? Date.now()) + 30000)}
                    className="min-h-[36px] rounded-lg border border-arena-gold/40 px-2.5 text-[11px] font-bold text-arena-gold active:scale-95"
                  >
                    +30 s
                  </button>
                  <button
                    onClick={() => setRestEndsAt(null)}
                    className="min-h-[36px] rounded-lg px-2.5 text-[11px] font-bold text-arena-muted active:scale-95"
                  >
                    Passer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="sticky bottom-0 border-t border-arena-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={requestFinish}
                disabled={saving}
                className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-base font-black transition disabled:opacity-40 ${
                  allDone ? "bg-arena-gold text-black" : "bg-arena text-arena-on"
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Enregistrement…
                  </>
                ) : (
                  `Terminer la séance${allDone ? "" : ` (${doneCount}/${totalSets})`}`
                )}
              </motion.button>
            </div>
          </>
        )}

        <ExerciseLibrary
          open={libOpen}
          onOpenChange={(v) => {
            setLibOpen(v);
            if (!v) setReplaceIdx(null);
          }}
          onAdd={addExercise}
        />

        <AlertDialog open={confirmFinish} onOpenChange={setConfirmFinish}>
          <AlertDialogContent className="max-w-[20rem] rounded-2xl border-arena-border bg-arena-surface">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Terminer maintenant ?</AlertDialogTitle>
              <AlertDialogDescription className="text-arena-sub">
                {doneCount} série{doneCount > 1 ? "s" : ""} validée{doneCount > 1 ? "s" : ""} sur{" "}
                {totalSets}. Seules les séries validées seront enregistrées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="min-h-[44px] border-arena-border">
                Continuer la séance
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void save()}
                className="min-h-[44px] bg-arena-gold font-black text-black"
              >
                Terminer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmAbandon} onOpenChange={setConfirmAbandon}>
          <AlertDialogContent className="max-w-[20rem] rounded-2xl border-arena-border bg-arena-surface">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Quitter la séance ?</AlertDialogTitle>
              <AlertDialogDescription className="text-arena-sub">
                Ta séance reste en cours : tu la retrouveras en revenant sur Entraînement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="min-h-[44px] border-arena-border">
                Rester
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmAbandon(false);
                  closeSheet();
                }}
                className="min-h-[44px] bg-arena font-black text-arena-on"
              >
                Mettre en pause
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-arena-border text-arena-muted transition active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function NumberField({
  value,
  onChange,
  max = 999,
  step = 1,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={text}
      placeholder={placeholder}
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
