import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Apple, Mail, Lock, ChevronRight, Target, Sparkles } from "lucide-react";

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const titles = [
    "REJOINS LA LIGUE. PROUVE TA FORCE.",
    "CRÉE TON COMPTE",
    "CHOISIS TA LIGUE",
    "FORGE TON PROFIL",
    "FIXE TON PREMIER OBJECTIF",
  ];

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col bg-background">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <Swords className="text-arena" size={20} />
          <span className="text-sm font-black tracking-[0.2em] text-foreground">CENTURIA</span>
        </div>
        <span className="text-xs text-arena-sub">{step + 1}/5</span>
      </div>

      <div className="flex-1 overflow-hidden px-5 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="mb-6 text-2xl font-black uppercase leading-tight tracking-tight text-foreground">
              {titles[step]}
            </h1>
            {step === 0 && <HeroCard />}
            {step === 1 && <AuthStep />}
            {step === 2 && <LeagueStep />}
            {step === 3 && <StatsStep />}
            {step === 4 && <GoalStep />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 pb-6">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => (step === 4 ? onDone() : setStep(step + 1))}
          className="h-14 w-full rounded-2xl bg-arena font-black uppercase tracking-wide text-arena-foreground shadow-[0_0_35px_var(--arena-glow)]"
        >
          {step === 4 ? "Entrer dans l'arène" : "Continuer"}
        </motion.button>
        {step === 0 && (
          <p className="mt-3 text-center text-xs text-arena-sub">J'ai déjà un compte</p>
        )}
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-5">
      <div className="mb-4 flex gap-2">
        {["🏛️", "⚔️", "🔥"].map((e, i) => (
          <span key={i} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">{e}</span>
        ))}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-arena-sub">
        La première plateforme française qui classe, vérifie et récompense officiellement les pratiquants de muscu.
      </p>
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-arena-gold" />
        <span className="text-xs text-arena-gold">Premier grade débloqué en 60 secondes</span>
      </div>
    </div>
  );
}

function AuthStep() {
  return (
    <div className="flex flex-col gap-3">
      <AuthBtn icon={Apple} label="Continuer avec Apple" />
      <AuthBtn icon={Mail} label="Continuer avec Google" />
      <AuthBtn icon={Lock} label="S'inscrire avec e-mail" />
    </div>
  );
}

function AuthBtn({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="flex h-14 items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface px-5 text-sm font-bold text-foreground">
      <Icon size={18} />
      {label}
    </button>
  );
}

function LeagueStep() {
  return (
    <div className="flex flex-col gap-3">
      <LeagueCard title="🏛️ NATURELLE" desc="Drug-free, testée." color="text-arena-green" />
      <LeagueCard title="⚔️ OPEN" desc="Tout le monde. Sans restriction." color="text-arena-purple" />
      <p className="mt-2 text-xs text-arena-muted">
        Tu peux changer de ligue 1 fois dans ta vie. Triche détectée = ban définitif.
      </p>
    </div>
  );
}

function LeagueCard({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      <p className={`font-black ${color}`}>{title}</p>
      <p className="mt-1 text-sm text-arena-sub">{desc}</p>
    </div>
  );
}

function StatsStep() {
  return (
    <div className="flex flex-col gap-3">
      <Input label="Pseudo" value="@maxime_lifts" />
      <Input label="Âge" value="22 ans" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Taille" value="178 cm" />
        <Input label="Poids" value="84 kg" />
      </div>
    </div>
  );
}

function GoalStep() {
  return (
    <div className="flex flex-col gap-3">
      {["Prise de masse", "Sèche", "Performance"].map((g) => (
        <div key={g} className="rounded-2xl border border-arena-border bg-arena-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-foreground">{g}</p>
              <p className="mt-1 text-xs text-arena-sub">Quêtes, XP et programme adaptés.</p>
            </div>
            <ChevronRight size={18} className="text-arena-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Input({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      <span className="text-xs text-arena-sub">{label}</span>
      <p className="mt-1 font-bold text-foreground">{value}</p>
    </div>
  );
}
