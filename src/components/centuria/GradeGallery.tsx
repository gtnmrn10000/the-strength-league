import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lock } from "lucide-react";
import { GRADES, GRADE_LABELS, THRESHOLDS, type Grade } from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";

const XP_PER_GRADE = 1500;

export default function GradeGallery({
  open,
  onOpenChange,
  currentGrade,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentGrade: Grade;
}) {
  const currentIdx = GRADES.indexOf(currentGrade);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            GALERIE DES GRADES
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-4 text-xs text-arena-sub">
            Progresse dans les 9 rangs de l'arène. Chaque grade débloque une nouvelle esthétique.
          </p>

          <div className="flex flex-col gap-3">
            {GRADES.map((g, idx) => {
              const isCurrent = idx === currentIdx;
              // QA/preview: tous les grades sont visibles en clair pour les testeurs.
              const isUnlocked = true;
              const xpRequired = idx * XP_PER_GRADE;
              const squatRatio = THRESHOLDS.squat[idx];
              const benchRatio = THRESHOLDS.bench[idx];
              const dlRatio = THRESHOLDS.deadlift[idx];

              return (
                <div
                  key={g}
                  className={`relative flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? "border-arena-gold bg-arena-gold/5 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                      : "border-arena-border bg-arena-surface"
                  }`}
                >
                  <div
                    style={{
                      opacity: isUnlocked ? 1 : 0.35,
                      filter: isUnlocked ? "none" : "grayscale(1)",
                    }}
                  >
                    <GradeIcon grade={g} size={64} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-foreground">{GRADE_LABELS[g]}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-arena-gold px-2 py-0.5 text-[9px] font-black tracking-widest text-black">
                          TU ES ICI
                        </span>
                      )}
                      {!isUnlocked && <Lock size={12} className="text-arena-muted" />}
                    </div>
                    <p className="mt-0.5 text-[10px] text-arena-sub">
                      Rang {idx + 1} · {xpRequired.toLocaleString()} XP
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-arena-muted">
                      Squat {squatRatio}× BW · Bench {benchRatio}× · DL {dlRatio}×
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
