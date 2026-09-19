import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GRADE_LABELS, GRADES, nextGradeInfo, type Grade } from "@/lib/grades";
import { GradeEmblem } from "./GradeEmblem";

/**
 * Overlay plein écran de passage de grade. À déclencher une seule fois par
 * franchissement de seuil (ex : quand `awardWorkoutXp` renvoie
 * `leveledUp: true` — le composant appelant est responsable de ne
 * l'ouvrir qu'une fois par transition, ex. via un flag local).
 */
export default function LevelUpOverlay({
  open,
  previousGrade,
  newGrade,
  totalXp,
  onContinue,
}: {
  open: boolean;
  previousGrade: Grade;
  newGrade: Grade;
  totalXp?: number;
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const tier = GRADES.indexOf(newGrade);
  const info = totalXp === undefined ? null : nextGradeInfo(totalXp);

  useEffect(() => {
    if (!open) { setReady(false); return; }
    const timer = window.setTimeout(() => setReady(true), reduceMotion ? 250 : tier < 5 ? 1800 : 2100);
    return () => window.clearTimeout(timer);
  }, [open, reduceMotion, tier]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="absolute"
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: reduceMotion ? 1 : 0.82 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.55, ease: "easeOut" }}
          >
            <GradeEmblem grade={previousGrade} size={104} />
          </motion.div>

          <motion.div
            className="absolute left-0 right-0 top-1/2 h-px origin-center bg-arena-gold/50"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.35, duration: reduceMotion ? 0.1 : 0.45 }}
          />

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduceMotion ? 0.1 : 0.72, type: "spring", stiffness: 210, damping: 22 }}
          >
            <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: reduceMotion ? 0 : 0.8, duration: reduceMotion ? 0.1 : 0.8 }}>
              <GradeEmblem grade={newGrade} size={148} state="current" animated />
            </motion.div>
          </motion.div>

          <motion.p
            className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-arena-sub"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0.1 : 1.05 }}
          >
            Grade débloqué
          </motion.p>
          <motion.h2
            className="mt-2 text-4xl font-black uppercase text-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0.1 : 1.15 }}
          >
            {GRADE_LABELS[newGrade]}
          </motion.h2>
          {totalXp !== undefined && (
            <motion.p className="mt-3 text-xs text-arena-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduceMotion ? 0.1 : 1.35 }}>
              {totalXp.toLocaleString()} XP{info?.nextGrade ? ` · ${info.xpRemaining.toLocaleString()} XP avant ${GRADE_LABELS[info.nextGrade]}` : " · grade maximum"}
            </motion.p>
          )}
          <motion.div className="mt-12" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }}>
            <Button onClick={onContinue} disabled={!ready} className="h-12 min-w-44 bg-foreground text-background hover:bg-foreground/90">
              Continuer
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
