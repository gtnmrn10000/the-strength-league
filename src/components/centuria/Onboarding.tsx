import { useState } from "react";
import { Swords, Apple, Mail, Lock, ChevronRight, ChevronLeft, Sparkles, ShieldCheck, Trophy, Check, Dumbbell, Target, TrendingUp } from "lucide-react";

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [age, setAge] = useState("");
  const [taille, setTaille] = useState("");
  const [poids, setPoids] = useState("");

  const titles = [
    "REJOINS LA LIGUE. PROUVE TA FORCE.",
    "CRÉE TON COMPTE",
    "CHOISIS TA LIGUE",
    "FORGE TON PROFIL",
    "FIXE TON PREMIER OBJECTIF",
  ];

  const canContinue = () => {
    if (step === 2) return selectedLeague !== null;
    if (step === 3) return pseudo.length > 0;
    if (step === 4) return selectedGoal !== null;
    return true;
  };

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-arena-sub active:scale-95 transition-transform">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <Swords className="text-arena" size={20} />
          )}
          <span className="text-sm font-black tracking-[0.2em] text-foreground">CENTURIA</span>
        </div>
        <span className="text-xs text-arena-sub">{step + 1}/5</span>
      </div>

      {/* Progress bar */}
      <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-arena transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 5) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-6 pb-4">
        <h1 className="mb-6 text-2xl font-black uppercase leading-tight tracking-tight text-foreground">
          {titles[step]}
        </h1>
        {step === 0 && <HeroCard />}
        {step === 1 && <AuthStep />}
        {step === 2 && <LeagueStep selected={selectedLeague} onSelect={setSelectedLeague} />}
        {step === 3 && (
          <StatsStep
            pseudo={pseudo} setPseudo={setPseudo}
            age={age} setAge={setAge}
            taille={taille} setTaille={setTaille}
            poids={poids} setPoids={setPoids}
          />
        )}
        {step === 4 && <GoalStep selected={selectedGoal} onSelect={setSelectedGoal} />}
      </div>

      {/* Footer */}
      <div className="px-5 pb-6">
        <button
          onClick={() => (step === 4 ? onDone() : setStep(step + 1))}
          disabled={!canContinue()}
          className={`h-14 w-full rounded-2xl font-black uppercase tracking-wide transition-all duration-200 active:scale-95
            ${canContinue()
              ? "bg-arena text-arena-foreground shadow-[0_0_35px_var(--arena-glow)]"
              : "bg-arena/30 text-arena-foreground/50 cursor-not-allowed"
            }`}
        >
          {step === 4 ? "⚔️ Entrer dans l'arène" : "Continuer"}
        </button>
        {step === 0 && (
          <button className="mt-3 w-full text-center text-xs font-semibold text-arena-sub hover:text-foreground transition-colors">
            J'ai déjà un compte
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 0: Hero ── */
function HeroCard() {
  return (
    <div className="flex flex-col gap-4">
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

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, label: "PR vérifiés par IA", color: "text-arena-green" },
          { icon: Trophy, label: "Classement national", color: "text-arena-gold" },
          { icon: Swords, label: "Guerre de factions", color: "text-arena" },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-3 text-center">
            <Icon size={20} className={color} />
            <span className="text-[10px] font-bold text-arena-sub leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step 1: Auth ── */
function AuthStep() {
  return (
    <div className="flex flex-col gap-3">
      <AuthBtn icon={Apple} label="Continuer avec Apple" highlight />
      <AuthBtn icon={Mail} label="Continuer avec Google" />
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-arena-border" />
        <span className="text-xs text-arena-muted">ou</span>
        <div className="h-px flex-1 bg-arena-border" />
      </div>
      <AuthBtn icon={Lock} label="S'inscrire avec e-mail" />
      <p className="mt-2 text-center text-[10px] text-arena-muted leading-relaxed">
        En continuant, tu acceptes les <span className="text-arena-sub underline">CGU</span> et la <span className="text-arena-sub underline">politique de confidentialité</span>.
      </p>
    </div>
  );
}

function AuthBtn({ icon: Icon, label, highlight }: { icon: React.ElementType; label: string; highlight?: boolean }) {
  return (
    <button className={`flex h-14 w-full items-center gap-3 rounded-2xl border px-5 text-sm font-bold text-foreground active:scale-[0.98] transition-transform
      ${highlight ? "border-arena/40 bg-arena/10" : "border-arena-border bg-arena-surface"}`}>
      <Icon size={18} />
      {label}
    </button>
  );
}

/* ── Step 2: League ── */
function LeagueStep({ selected, onSelect }: { selected: string | null; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <LeagueCard
        title="NATURELLE"
        emoji="🏛️"
        desc="Drug-free. Tous tes PR sont vérifiés par IA vidéo. Triche = ban définitif."
        features={["Vérification IA", "Badge drug-free", "Classement protégé"]}
        color="text-arena-green"
        selected={selected === "naturelle"}
        onSelect={() => onSelect("naturelle")}
      />
      <LeagueCard
        title="OPEN"
        emoji="⚔️"
        desc="Tout le monde. Aucune restriction, aucun jugement. Seule la force compte."
        features={["Sans restriction", "Tous niveaux", "Classement libre"]}
        color="text-arena-purple"
        selected={selected === "open"}
        onSelect={() => onSelect("open")}
      />
      <div className="mt-2 flex items-start gap-2 rounded-xl bg-arena/5 p-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-arena" />
        <p className="text-xs text-arena-muted leading-relaxed">
          Tu peux changer de ligue <span className="font-bold text-arena-sub">1 seule fois</span> dans ta vie. Choisis bien.
        </p>
      </div>
    </div>
  );
}

function LeagueCard({ title, emoji, desc, features, color, selected, onSelect }: {
  title: string; emoji: string; desc: string; features: string[]; color: string; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98]
        ${selected
          ? "border-arena bg-arena/10 shadow-[0_0_20px_var(--arena-glow)]"
          : "border-arena-border bg-arena-surface hover:border-arena/30"
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className={`font-black ${color}`}>{title}</span>
        </div>
        {selected && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-arena">
            <Check size={14} className="text-arena-foreground" />
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-arena-sub">{desc}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {features.map((f) => (
          <span key={f} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-arena-sub">{f}</span>
        ))}
      </div>
    </button>
  );
}

/* ── Step 3: Profile Stats ── */
function StatsStep({ pseudo, setPseudo, age, setAge, taille, setTaille, poids, setPoids }: {
  pseudo: string; setPseudo: (v: string) => void;
  age: string; setAge: (v: string) => void;
  taille: string; setTaille: (v: string) => void;
  poids: string; setPoids: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-arena-sub">Ces infos permettent de calculer tes ratios et te classer correctement.</p>
      <InputField label="Pseudo" placeholder="@ton_pseudo" value={pseudo} onChange={setPseudo} required />
      <InputField label="Âge" placeholder="22" value={age} onChange={setAge} suffix="ans" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Taille" placeholder="178" value={taille} onChange={setTaille} suffix="cm" />
        <InputField label="Poids" placeholder="84" value={poids} onChange={setPoids} suffix="kg" />
      </div>
      <div className="mt-1 flex items-start gap-2 rounded-xl bg-arena/5 p-3">
        <Lock size={14} className="mt-0.5 shrink-0 text-arena-muted" />
        <p className="text-[11px] text-arena-muted leading-relaxed">
          Ton poids n'est visible que dans tes ratios. Tu peux le masquer dans les réglages.
        </p>
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, suffix, required }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; suffix?: string; required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4 focus-within:border-arena/50 transition-colors">
      <label className="text-xs text-arena-sub">
        {label} {required && <span className="text-arena">*</span>}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent font-bold text-foreground outline-none placeholder:text-arena-muted"
        />
        {suffix && <span className="text-xs text-arena-muted">{suffix}</span>}
      </div>
    </div>
  );
}

/* ── Step 4: Goal ── */
function GoalStep({ selected, onSelect }: { selected: string | null; onSelect: (v: string) => void }) {
  const goals = [
    {
      id: "masse",
      label: "Prise de masse",
      desc: "Surplus calorique, programmes hypertrophie, progression de charge.",
      icon: Dumbbell,
      emoji: "💪",
    },
    {
      id: "seche",
      label: "Sèche",
      desc: "Déficit calorique contrôlé, maintien de force, suivi macro.",
      icon: Target,
      emoji: "🔥",
    },
    {
      id: "performance",
      label: "Performance",
      desc: "Maximise tes PR. Programmation force pure, peaking, ratios.",
      icon: TrendingUp,
      emoji: "⚡",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="mb-1 text-sm text-arena-sub">Ton objectif détermine tes quêtes, ton XP et ton programme IA.</p>
      {goals.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98]
            ${selected === g.id
              ? "border-arena bg-arena/10 shadow-[0_0_20px_var(--arena-glow)]"
              : "border-arena-border bg-arena-surface hover:border-arena/30"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{g.emoji}</span>
              <div>
                <p className="font-black text-foreground">{g.label}</p>
                <p className="mt-0.5 text-xs text-arena-sub">{g.desc}</p>
              </div>
            </div>
            {selected === g.id && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arena">
                <Check size={14} className="text-arena-foreground" />
              </div>
            )}
          </div>
        </button>
      ))}
      <div className="mt-2 flex items-start gap-2 rounded-xl bg-arena-gold/5 p-3">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-arena-gold" />
        <p className="text-[11px] text-arena-gold leading-relaxed">
          Tu pourras changer d'objectif à tout moment dans les réglages.
        </p>
      </div>
    </div>
  );
}
