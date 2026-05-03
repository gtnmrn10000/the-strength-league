import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flag, Swords } from "lucide-react";

const ranking: [number, string, string, string][] = [
  [1, "Marius", "TITAN", "690 kg"],
  [2, "Noah", "DEMI-DIEU", "642 kg"],
  [3, "Enzo", "DEMI-DIEU", "625 kg"],
  [847, "Toi", "SPARTIATE", "530 kg"],
];

export default function Rankings() {
  const [sub, setSub] = useState("Classements");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-2 pb-4">
      <div className="mb-4 flex gap-2">
        {["Classements", "Guerre", "Duels"].map((x) => (
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
            {["Naturelle", "National", "Total", "-93kg"].map((x) => (
              <span key={x} className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-[10px] font-bold text-arena-sub">{x}</span>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {ranking.map(([pos, name, grade, total]) => (
              <div key={pos} className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3">
                <span className={`text-lg font-black ${pos <= 3 ? "text-arena-gold" : "text-arena-sub"}`}>#{pos}</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{name}</p>
                  <p className="text-xs text-arena-sub">{grade}</p>
                </div>
                <span className="font-black text-foreground">{total}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-arena-sub">Tu es #847 sur 47 392 — Top 1,8%</p>
        </>
      )}

      {sub === "Guerre" && (
        <div className="rounded-2xl border border-arena-border bg-arena-surface p-5 text-center">
          <Flag size={28} className="mx-auto text-arena" />
          <p className="mt-3 font-black text-foreground">Guerre de Factions</p>
          <p className="mt-1 text-xs text-arena-sub">Saison 1 en cours — J-47</p>
        </div>
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
    </motion.div>
  );
}
