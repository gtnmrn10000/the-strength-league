import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GRADE_LABELS, GRADE_XP, GRADES, type Grade } from "@/lib/grades";
import { GradeEmblem, type GradeEmblemState } from "./GradeEmblem";
import LevelUpOverlay from "./LevelUpOverlay";

const TRANSITIONS: Array<[Grade, Grade]> = [
  ["recruit", "soldat"],
  ["guerrier", "spartiate"],
  ["gladiateur", "centurion"],
  ["centurion", "titan"],
  ["titan", "legende"],
  ["legende", "divin"],
];

export default function GradeQaPreview() {
  const [state, setState] = useState<GradeEmblemState>("unlocked");
  const [transition, setTransition] = useState<[Grade, Grade] | null>(null);

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-background px-4 py-8 text-foreground">
      <header className="mb-8">
        <p className="text-xs text-arena-muted">Aperçu local · aucune donnée modifiée</p>
        <h1 className="mt-1 text-2xl font-black">Grades Centuria</h1>
      </header>

      <div className="mb-7 flex gap-1 border-b border-arena-border pb-3">
        {(["unlocked", "current", "locked"] as const).map((value) => (
          <Button key={value} variant={state === value ? "secondary" : "ghost"} size="sm" onClick={() => setState(value)}>
            {value === "unlocked" ? "Débloqué" : value === "current" ? "Actuel" : "Verrouillé"}
          </Button>
        ))}
      </div>

       <section className="flex flex-col" aria-label="Tous les emblèmes">
        {GRADES.map((grade) => (
           <div key={grade} className="flex min-h-28 min-w-0 items-center gap-5 border-b border-arena-border py-4">
             <GradeEmblem grade={grade} size={94} state={state} context="gallery" animated progress={state === "current" ? 62 : undefined} />
             <div><p className="text-base font-bold">{GRADE_LABELS[grade]}</p><p className="mt-1 text-xs text-arena-muted">{GRADE_XP[grade].toLocaleString()} XP</p></div>
          </div>
        ))}
      </section>

      <section className="mt-10 border-t border-arena-border pt-5">
        <h2 className="text-sm font-bold">Transitions</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {TRANSITIONS.map(([previous, next]) => (
            <Button key={`${previous}-${next}`} variant="outline" className="h-auto min-h-11 whitespace-normal px-3 py-2 text-xs" onClick={() => setTransition([previous, next])}>
              {GRADE_LABELS[previous]} → {GRADE_LABELS[next]}
            </Button>
          ))}
        </div>
      </section>

      {transition && (
        <LevelUpOverlay
          open
          previousGrade={transition[0]}
          newGrade={transition[1]}
          totalXp={GRADE_XP[transition[1]]}
          onContinue={() => setTransition(null)}
        />
      )}
    </main>
  );
}