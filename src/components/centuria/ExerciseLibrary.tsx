import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus } from "lucide-react";
import {
  EXERCISE_LIBRARY,
  CATEGORY_LABEL,
  CATEGORY_ICON,
  CATEGORY_ACCENT,
  type LibraryExercise,
  type MuscleCategory,
} from "@/lib/exerciseCatalog";

const CATEGORIES: (MuscleCategory | "all")[] = ["all", "pectoraux", "dos", "jambes", "epaules", "bras", "abdos"];

export default function ExerciseLibrary({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd?: (ex: LibraryExercise) => void;
}) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (norm && !e.name.toLowerCase().includes(norm)) return false;
      return true;
    });
  }, [cat, q]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            BIBLIOTHÈQUE D'EXERCICES
          </SheetTitle>
        </SheetHeader>

        <div className="border-b border-arena-border px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-arena-muted" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un exercice…"
              className="w-full rounded-xl border border-arena-border bg-secondary py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-arena-muted focus:border-arena focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-widest transition ${
                  cat === c
                    ? "border-arena-gold bg-arena-gold text-black"
                    : "border-arena-border bg-arena-surface text-arena-sub"
                }`}
              >
                {c === "all" ? "TOUT" : CATEGORY_LABEL[c].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-xs text-arena-muted">Aucun exercice trouvé</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-arena-gold/10">
                      <Dumbbell size={18} className="text-arena-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{ex.name}</p>
                      <p className="mt-0.5 text-[10px] text-arena-sub">
                        {CATEGORY_LABEL[ex.category]} · {ex.muscles.join(" · ")}
                      </p>
                    </div>
                  </div>
                  {onAdd && (
                    <button
                      onClick={() => onAdd(ex)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-arena-gold text-black active:scale-90 transition"
                      aria-label="Ajouter à la séance"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
