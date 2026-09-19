import { motion } from "framer-motion";
import { Check, Clock, Dumbbell, Flame, Share2, Trophy } from "lucide-react";
import type { Template } from "@/lib/workoutTemplates";
import { formatVolume } from "@/lib/progress";

export type NewRecord = { name: string; weight_kg: number; reps: number };

export type SessionResult = {
  template: Template;
  durationMin: number | null;
  exercises: number;
  sets: number;
  volume: number;
  records: NewRecord[];
  xpGained?: number;
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 26 } },
};

export default function SessionSummary({
  result,
  onClose,
  onShare,
}: {
  result: SessionResult;
  onClose: () => void;
  onShare?: () => void;
}) {
  const { template, durationMin, exercises, sets, volume, records, xpGained } = result;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5"
      >
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-arena-gold/40 bg-arena-gold/10">
            <Check size={20} className="text-arena-gold" strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black leading-tight text-foreground">Séance enregistrée</p>
            <p className="truncate text-xs text-arena-sub">{template.name}</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-5 grid grid-cols-3 gap-2">
          <Stat icon={Clock} label="Durée" value={durationMin ? `${durationMin} min` : "—"} />
          <Stat icon={Dumbbell} label="Séries" value={`${sets}`} />
          <Stat icon={Flame} label="Volume" value={formatVolume(volume)} />
        </motion.div>

        <motion.p variants={item} className="mt-3 text-xs text-arena-sub">
          {exercises} exercice{exercises > 1 ? "s" : ""} travaillé{exercises > 1 ? "s" : ""}.
        </motion.p>

        {records.length > 0 && (
          <motion.div
            variants={item}
            className="mt-5 rounded-2xl border border-arena-gold/40 bg-arena-gold/5 p-4"
          >
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-arena-gold" />
              <p className="text-sm font-black text-arena-gold">
                {records.length > 1 ? "Nouveaux records" : "Nouveau record"}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {records.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-foreground">{r.name}</span>
                  <span className="shrink-0 font-black text-arena-gold">
                    {r.weight_kg} kg × {r.reps}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {typeof xpGained === "number" && xpGained > 0 && (
          <motion.p variants={item} className="mt-4 text-sm text-arena-sub">
            <span className="font-black text-foreground">+{xpGained} XP</span> pour cette séance.
          </motion.p>
        )}
      </motion.div>

      <div className="border-t border-arena-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {onShare && (
          <button
            onClick={onShare}
            className="mb-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-arena-border text-sm font-bold text-foreground active:scale-[0.98]"
          >
            <Share2 size={15} /> Partager la séance
          </button>
        )}
        <button
          onClick={onClose}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-arena-gold text-base font-black text-black active:scale-[0.98]"
        >
          Retour à l'entraînement
        </button>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-3">
      <Icon size={14} className="text-arena-muted" />
      <p className="mt-2 truncate text-base font-black leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[10px] text-arena-muted">{label}</p>
    </div>
  );
}
