import { motion } from "framer-motion";
import { Camera, NotebookPen, Target, Sparkles, ChevronRight } from "lucide-react";

export default function Training({ onPR }: { onPR: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-2 pb-4">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ActionCard icon={Camera} title="Log un PR" glow onClick={onPR} />
        <ActionCard icon={NotebookPen} title="Log séance" />
        <ActionCard icon={Target} title="Mes objectifs" />
        <ActionCard icon={Sparkles} title="Coach IA" />
      </div>

      <SectionTitle>TES PR ACTUELS</SectionTitle>
      <div className="flex flex-col gap-3">
        {([["Squat", 180, "2,14x"], ["Bench", 130, "1,55x"], ["Deadlift", 220, "2,62x"]] as const).map(([e, kg, r]) => (
          <div key={e} className="flex items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-4">
            <div>
              <p className="font-black text-foreground">{e}</p>
              <p className="text-xs text-arena-sub">Ratio {r} BW</p>
            </div>
            <span className="text-xl font-black text-arena">{kg}kg</span>
          </div>
        ))}
      </div>

      <SectionTitle>PROGRAMME IA RECOMMANDÉ</SectionTitle>
      <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <p className="font-black text-foreground">Push Force · Grade Spartiate</p>
        <p className="mt-1 text-xs text-arena-sub">
          Séance optimisée pour passer Gladiateur Bench sous 21 jours.
        </p>
        <button className="mt-3 flex items-center gap-1 text-sm font-bold text-arena">
          Démarrer <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon: Icon, title, glow, onClick }: { icon: React.ElementType; title: string; glow?: boolean; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-4 ${glow ? "shadow-[0_0_20px_var(--arena-glow)]" : ""}`}
    >
      <Icon size={22} className={glow ? "text-arena" : "text-arena-sub"} />
      <span className="text-xs font-bold text-foreground">{title}</span>
    </motion.button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">{children}</h3>;
}
