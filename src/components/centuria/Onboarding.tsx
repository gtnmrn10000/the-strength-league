import { useState, useCallback } from "react";
import { Apple, Mail, Lock, ChevronLeft, Sparkles, ShieldCheck, Trophy, Check, Dumbbell, Target, TrendingUp, AlertCircle } from "lucide-react";
import Logo from "./Logo";
import { saveUserProfile } from "./userProfile";

/* ── Validation helpers ── */

interface StatsErrors {
  pseudo?: string;
  age?: string;
  taille?: string;
  poids?: string;
}

function validatePseudo(v: string): string | undefined {
  const trimmed = v.trim();
  if (trimmed.length === 0) return "Le pseudo est obligatoire.";
  if (trimmed.length < 3) return "3 caractères minimum.";
  if (trimmed.length > 24) return "24 caractères maximum.";
  if (!/^@?[a-zA-Z0-9_]+$/.test(trimmed)) return "Lettres, chiffres et _ uniquement.";
  return undefined;
}

function validateNumericField(v: string, label: string, min: number, max: number): string | undefined {
  if (v.trim().length === 0) return undefined; // optional field
  const n = Number(v.replace(",", "."));
  if (isNaN(n) || !isFinite(n)) return `${label} doit être un nombre.`;
  if (n < min || n > max) return `Entre ${min} et ${max}.`;
  if (!/^\d+([.,]\d{0,1})?$/.test(v.trim())) return "1 décimale max.";
  return undefined;
}

function validateStats(pseudo: string, age: string, taille: string, poids: string): StatsErrors {
  return {
    pseudo: validatePseudo(pseudo),
    age: validateNumericField(age, "L'âge", 13, 99),
    taille: validateNumericField(taille, "La taille", 100, 230),
    poids: validateNumericField(poids, "Le poids", 30, 250),
  };
}

function hasErrors(errors: StatsErrors): boolean {
  return Object.values(errors).some((e) => e !== undefined);
}

/* ── Main component ── */

const OB_KEY = "centuria_onboarding";

interface OnboardingData {
  step: number;
  league: string | null;
  goal: string | null;
  pseudo: string;
  age: string;
  taille: string;
  poids: string;
}

function loadSaved(): OnboardingData {
  if (typeof window === "undefined") return { step: 0, league: null, goal: null, pseudo: "", age: "", taille: "", poids: "" };
  try {
    const raw = localStorage.getItem(OB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { step: 0, league: null, goal: null, pseudo: "", age: "", taille: "", poids: "" };
}

function saveDraft(data: OnboardingData) {
  localStorage.setItem(OB_KEY, JSON.stringify(data));
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const saved = loadSaved();
  const [step, setStep] = useState(saved.step);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(saved.league);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(saved.goal);
  const [pseudo, setPseudo] = useState(saved.pseudo);
  const [age, setAge] = useState(saved.age);
  const [taille, setTaille] = useState(saved.taille);
  const [poids, setPoids] = useState(saved.poids);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [triedContinue, setTriedContinue] = useState(false);

  const titles = [
    "REJOINS LA LIGUE. PROUVE TA FORCE.",
    "CRÉE TON COMPTE",
    "CHOISIS TA LIGUE",
    "FORGE TON PROFIL",
    "FIXE TON PREMIER OBJECTIF",
  ];

  const statsErrors = validateStats(pseudo, age, taille, poids);

  const canContinue = useCallback(() => {
    if (step === 2) return selectedLeague !== null;
    if (step === 3) return !hasErrors(statsErrors) && pseudo.trim().length >= 3;
    if (step === 4) return selectedGoal !== null;
    return true;
  }, [step, selectedLeague, selectedGoal, statsErrors, pseudo]);

  const persist = (overrides: Partial<OnboardingData> = {}) => {
    saveDraft({ step, league: selectedLeague, goal: selectedGoal, pseudo, age, taille, poids, ...overrides });
  };

  const handleContinue = () => {
    if (step === 3) {
      setTriedContinue(true);
      if (!canContinue()) return;
    }
    if (!canContinue()) return;
    if (step === 4) {
      localStorage.removeItem(OB_KEY);
      saveUserProfile({ pseudo, age, taille, poids, league: selectedLeague, goal: selectedGoal });
      onDone();
    } else {
      const next = step + 1;
      setTriedContinue(false);
      setTouched({});
      setStep(next);
      persist({ step: next });
    }
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof StatsErrors) => {
    return (touched[field] || triedContinue) ? statsErrors[field] : undefined;
  };

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          {step > 0 ? (
            <button
              onClick={() => { setStep(step - 1); setTriedContinue(false); }}
              className="flex items-center gap-1 text-arena-sub active:scale-95 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <Logo />
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
        {step === 2 && <LeagueStep selected={selectedLeague} onSelect={(v) => { setSelectedLeague(v); persist({ league: v }); }} />}
        {step === 3 && (
          <StatsStep
            pseudo={pseudo} setPseudo={(v) => { setPseudo(v); markTouched("pseudo"); persist({ pseudo: v }); }}
            age={age} setAge={(v) => { setAge(v); markTouched("age"); persist({ age: v }); }}
            taille={taille} setTaille={(v) => { setTaille(v); markTouched("taille"); persist({ taille: v }); }}
            poids={poids} setPoids={(v) => { setPoids(v); markTouched("poids"); persist({ poids: v }); }}
            errors={{
              pseudo: showError("pseudo"),
              age: showError("age"),
              taille: showError("taille"),
              poids: showError("poids"),
            }}
          />
        )}
        {step === 4 && <GoalStep selected={selectedGoal} onSelect={(v) => { setSelectedGoal(v); persist({ goal: v }); }} />}
      </div>

      {/* Footer */}
      <div className="px-5 pb-6">
        <button
          onClick={handleContinue}
          disabled={step !== 3 && !canContinue()}
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
        <div className="mb-4 flex items-center justify-center">
          <Logo size="lg" />
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
          { icon: Trophy, label: "Guerre de factions", color: "text-arena" },
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
        title="NATURELLE" emoji="🛡️"
        desc="Drug-free. Tous tes PR sont vérifiés par IA vidéo. Triche = ban définitif."
        features={["Vérification IA", "Badge drug-free", "Classement protégé"]}
        color="text-arena-green" selected={selected === "naturelle"}
        onSelect={() => onSelect("naturelle")}
      />
      <LeagueCard
        title="OLYMPIEN" emoji="⚡"
        desc="Aucune limite. Force brute, performances extrêmes. Seul le total compte."
        features={["Sans restriction", "Force maximale", "Classement absolu"]}
        color="text-arena-purple" selected={selected === "olympien"}
        onSelect={() => onSelect("olympien")}
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
function StatsStep({ pseudo, setPseudo, age, setAge, taille, setTaille, poids, setPoids, errors }: {
  pseudo: string; setPseudo: (v: string) => void;
  age: string; setAge: (v: string) => void;
  taille: string; setTaille: (v: string) => void;
  poids: string; setPoids: (v: string) => void;
  errors: StatsErrors;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-arena-sub">Ces infos permettent de calculer tes ratios et te classer correctement.</p>
      <InputField label="Pseudo" placeholder="@ton_pseudo" value={pseudo} onChange={setPseudo} error={errors.pseudo} required />
      <InputField label="Âge" placeholder="22" value={age} onChange={setAge} suffix="ans" error={errors.age} inputMode="numeric" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Taille" placeholder="178" value={taille} onChange={setTaille} suffix="cm" error={errors.taille} inputMode="decimal" />
        <InputField label="Poids" placeholder="84" value={poids} onChange={setPoids} suffix="kg" error={errors.poids} inputMode="decimal" />
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

function InputField({ label, placeholder, value, onChange, suffix, required, error, inputMode }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  suffix?: string; required?: boolean; error?: string; inputMode?: "text" | "numeric" | "decimal";
}) {
  return (
    <div>
      <div className={`rounded-2xl border bg-arena-surface p-4 transition-colors
        ${error ? "border-destructive/60" : "border-arena-border focus-within:border-arena/50"}`}>
        <label className="text-xs text-arena-sub">
          {label} {required && <span className="text-arena">*</span>}
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            inputMode={inputMode || "text"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={label === "Pseudo" ? 25 : 6}
            className="flex-1 bg-transparent font-bold text-foreground outline-none placeholder:text-arena-muted"
          />
          {suffix && <span className="text-xs text-arena-muted">{suffix}</span>}
        </div>
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 px-1">
          <AlertCircle size={12} className="shrink-0 text-destructive" />
          <span className="text-[11px] text-destructive">{error}</span>
        </div>
      )}
    </div>
  );
}

/* ── Step 4: Goal ── */
function GoalStep({ selected, onSelect }: { selected: string | null; onSelect: (v: string) => void }) {
  const goals = [
    { id: "masse", label: "Prise de masse", desc: "Surplus calorique, programmes hypertrophie, progression de charge.", emoji: "💪" },
    { id: "seche", label: "Sèche", desc: "Déficit calorique contrôlé, maintien de force, suivi macro.", emoji: "🔥" },
    { id: "performance", label: "Performance", desc: "Maximise tes PR. Programmation force pure, peaking, ratios.", emoji: "⚡" },
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
