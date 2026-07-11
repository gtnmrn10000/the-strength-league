import { useState } from "react";
import { GRADES, GRADE_LABELS, type Grade } from "@/lib/grades";

// Podium généré à partir des vrais grades Centuria (Recrue → Divin).
// Positions élevées → grades élevés, décroissant vers "Toi".
const ranking: { pos: number; name: string; grade: Grade; total: string }[] = [
  { pos: 1, name: "Marius", grade: "divin", total: "820 kg" },
  { pos: 2, name: "Noah", grade: "legende", total: "755 kg" },
  { pos: 3, name: "Enzo", grade: "titan", total: "690 kg" },
  { pos: 12, name: "Lucas", grade: "centurion", total: "612 kg" },
  { pos: 47, name: "Théo", grade: "gladiateur", total: "548 kg" },
  { pos: 847, name: "Toi", grade: "spartiate", total: "530 kg" },
];

// Sanity check à la compilation : tous les grades utilisés existent bien.
ranking.forEach((r) => {
  if (!GRADES.includes(r.grade)) {
    // eslint-disable-next-line no-console
    console.warn("[Rankings] grade inconnu:", r.grade);
  }
});

export default function Rankings() {
  const [sub, setSub] = useState("Classements");

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-4 flex gap-2">
        {["Classements", "Duels"].map((x) => (
          <button
            key={x}
            onClick={() => setSub(x)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${sub === x ? "bg-arena text-arena-foreground" : "border border-arena-border bg-arena-surface text-arena-sub"}`}
          >
            {x}
          </button>
        ))}
      </div>

      {sub === "Classements" && (
        <>
          <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {["National", "Total", "-93kg", "-105kg", "+105kg"].map((x) => (
              <span key={x} className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-[10px] font-bold text-arena-sub">{x}</span>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {ranking.map(({ pos, name, grade, total }) => (
              <div key={pos} className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3">
                <span className={`text-lg font-black ${pos <= 3 ? "text-arena-gold" : "text-arena-sub"}`}>#{pos}</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{name}</p>
                  <p className="text-xs uppercase tracking-widest text-arena-sub">{GRADE_LABELS[grade]}</p>
                </div>
                <span className="font-black text-foreground">{total}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-arena-sub">Tu es #847 sur 47 392 — Top 1,8%</p>
        </>
      )}

      {sub === "Duels" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
            <p className="font-bold text-foreground">Défi vs Lucas</p>
            <p className="mt-1 text-xs text-arena-sub">Deadline demain · Bench 1RM · Tu mènes +2,5kg</p>
          </div>
          <button className="flex h-12 items-center justify-center rounded-2xl border border-arena bg-arena/10 text-sm font-bold text-arena">
            Lancer un défi
          </button>
        </div>
      )}
    </div>
  );
}
