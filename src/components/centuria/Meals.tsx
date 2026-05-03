import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function Meals() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-2 pb-4">
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <Ring label="Kcal" value="2 140" max="2 800" pct={76} />
        <Ring label="Prot" value="145g" max="180g" pct={80} />
        <Ring label="Carbs" value="210g" max="300g" pct={70} />
      </div>

      <div className="mb-3 flex gap-3">
        <button className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-arena-border bg-arena-surface text-xs font-bold text-foreground">
          <Plus size={14} /> Ajouter un repas
        </button>
      </div>

      <h3 className="mb-3 text-xs font-black tracking-widest text-arena-muted">MON COOKBOOK</h3>
      <div className="grid grid-cols-2 gap-3">
        {["Bowl massif", "Poulet riz", "Pancakes prot", "Wrap sèche"].map((x) => (
          <div key={x} className="rounded-2xl border border-arena-border bg-arena-surface p-4">
            <p className="text-sm font-bold text-foreground">{x}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Ring({ label, value, max, pct }: { label: string; value: string; max: string; pct: number }) {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--arena-border)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r="30" fill="none"
          stroke="var(--arena)" strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="mt-1 text-sm font-black text-foreground">{value}</span>
      <span className="text-[10px] text-arena-sub">{label}</span>
      <span className="text-[10px] text-arena-muted">/ {max}</span>
    </div>
  );
}
