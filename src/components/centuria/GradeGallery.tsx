import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lock } from "lucide-react";
import { GRADES, GRADE_LABELS, GRADE_XP, gradeForXp, type Grade } from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";

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
          <p className="mb-4 text-xs text-arena-sub">
            Neuf rangs, débloqués à l'XP. Tu en gagnes en terminant tes séances,
            en restant régulier et en faisant vérifier tes records.
          </p>

          <div className="flex flex-col gap-3">
            {GRADES.map((g, idx) => {
              const isCurrent = idx === currentIdx;
              const required = GRADE_XP[g];
              const isUnlocked = xp >= required;
              const missing = Math.max(0, required - xp);

              return (
                <div
                  key={g}
                  className={`relative flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? "border-arena-gold bg-arena-gold/5"
                      : "border-arena-border bg-arena-surface"
                  }`}
                >
                  <div
                    style={{
                      opacity: isUnlocked ? 1 : 0.3,
                      filter: isUnlocked ? "none" : "grayscale(1)",
                    }}
                  >
                    <GradeIcon grade={g} size={64} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-black text-foreground">{GRADE_LABELS[g]}</p>
                      {isCurrent && (
                        <span className="shrink-0 rounded-full bg-arena-gold px-2 py-0.5 text-[9px] font-black tracking-widest text-black">
                          TU ES ICI
                        </span>
                      )}
                      {!isUnlocked && <Lock size={12} className="shrink-0 text-arena-muted" />}
                    </div>
                    <p className="mt-0.5 text-[10px] text-arena-sub">
                      Rang {idx + 1} · {required.toLocaleString()} XP
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-arena-muted">
                      {isUnlocked
                        ? "Débloqué"
                        : `Encore ${missing.toLocaleString()} XP`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
