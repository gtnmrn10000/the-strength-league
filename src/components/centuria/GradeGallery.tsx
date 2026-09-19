import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, useReducedMotion } from "framer-motion";
import { GRADES, GRADE_LABELS, GRADE_XP, gradeForXp, type Grade } from "@/lib/grades";
import { GradeEmblem } from "./grades/GradeEmblem";

export default function GradeGallery({
  open,
  onOpenChange,
  currentGrade,
  xp = 0,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentGrade: Grade;
  xp?: number;
}) {
  // Le grade affiché dérive de l'XP réel ; `currentGrade` sert de repli.
  const grade = xp > 0 ? gradeForXp(xp) : currentGrade;
  const currentIdx = GRADES.indexOf(grade);
  const reduceMotion = useReducedMotion();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            GRADES
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col">
            {GRADES.map((g, idx) => {
              const isCurrent = idx === currentIdx;
              const required = GRADE_XP[g];
              const isUnlocked = xp >= required;
              const missing = Math.max(0, required - xp);

              return (
                <motion.div
                  key={g}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : idx * 0.035, duration: 0.18 }}
                  className={`relative flex min-h-[76px] items-center gap-3 border-b px-1 py-3 ${
                    isCurrent
                      ? "border-arena-gold/40 bg-arena-gold/[0.035]"
                      : "border-arena-border"
                  }`}
                >
                  <GradeEmblem
                    grade={g}
                    size={54}
                    state={isCurrent ? "current" : isUnlocked ? "unlocked" : "locked"}
                    progress={isCurrent ? Math.max(3, Math.min(100, idx === GRADES.length - 1 ? 100 : ((xp - required) / (GRADE_XP[GRADES[idx + 1]] - required)) * 100)) : undefined}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-black text-foreground">{GRADE_LABELS[g]}</p>
                      {isCurrent && <span className="text-[10px] text-arena-gold">Grade actuel</span>}
                    </div>
                    <p className="mt-0.5 text-[10px] text-arena-sub">
                      {required.toLocaleString()} XP requis
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-arena-muted">
                      {isUnlocked
                        ? isCurrent ? "Progression en cours" : "Débloqué"
                        : `Encore ${missing.toLocaleString()} XP`}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
