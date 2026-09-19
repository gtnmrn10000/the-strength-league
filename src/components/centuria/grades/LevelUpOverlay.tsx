import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GRADE_LABELS, nextGradeInfo, type Grade } from "@/lib/grades";
import { GradeEmblem } from "./GradeEmblem";

export default function LevelUpOverlay({ open, previousGrade, newGrade, totalXp, onContinue }: { open: boolean; previousGrade: Grade; newGrade: Grade; totalXp?: number; onContinue: () => void }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [ready, setReady] = useState(false);
  const info = totalXp === undefined ? null : nextGradeInfo(totalXp);

  useEffect(() => {
    if (!open) { setReady(false); return; }
    const timer = window.setTimeout(() => setReady(true), reduceMotion ? 180 : 1850);
    return () => window.clearTimeout(timer);
  }, [open, reduceMotion]);

  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6" role="dialog" aria-modal="true" aria-labelledby="level-up-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? .01 : .18 }}>
    <motion.div className="absolute" initial={{ opacity: .78, scale: 1 }} animate={{ opacity: 0, scale: reduceMotion ? 1 : .88 }} transition={{ delay: .08, duration: reduceMotion ? .01 : .48, ease: "easeOut" }}><GradeEmblem grade={previousGrade} size={116} /></motion.div>
    <motion.div className="absolute left-0 right-0 top-1/2 h-px origin-center bg-arena-gold/40" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }} transition={{ delay: reduceMotion ? 0 : .35, duration: reduceMotion ? .01 : .4, times: [0, .65, 1] }} />
    <motion.div initial={{ opacity: 0, scale: reduceMotion ? 1 : .84 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduceMotion ? 0 : .73, type: "spring", stiffness: 185, damping: 24, mass: .8 }}>
      <GradeEmblem grade={newGrade} size={156} active animated />
    </motion.div>
    <motion.div className="mt-7 text-center" initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 1.45, duration: .28 }}>
      <h2 id="level-up-title" className="text-4xl font-black uppercase text-foreground">{GRADE_LABELS[newGrade]}</h2>
      <p className="mt-2 text-[11px] font-semibold text-arena-sub">Grade débloqué</p>
      {totalXp !== undefined && <p className="mt-3 text-xs text-arena-muted">{totalXp.toLocaleString()} XP{info?.nextGrade ? ` · ${info.xpRemaining.toLocaleString()} XP avant ${GRADE_LABELS[info.nextGrade]}` : " · grade maximum"}</p>}
    </motion.div>
    <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: .2 }}><Button onClick={onContinue} disabled={!ready} className="h-12 min-w-44 bg-foreground text-background hover:bg-foreground/90">CONTINUER</Button></motion.div>
  </motion.div>}</AnimatePresence>;
}