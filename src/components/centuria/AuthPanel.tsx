import { useState } from "react";
import { Apple, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

type Mode = "signup" | "login";

function frError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
  if (m.includes("email not confirmed")) return "Confirme ton e-mail avant de te connecter.";
  if (m.includes("password")) return "Mot de passe trop faible (6 caractères minimum).";
  if (m.includes("provider") || m.includes("unsupported")) return "Cette méthode de connexion n'est pas encore disponible.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessaie dans quelques minutes.";
  return message;
}

export default function AuthPanel({
  initialMode = "signup",
  onAuthenticated,
}: {
  initialMode?: Mode;
  onAuthenticated?: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google" | "apple">(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const submitEmail = async () => {
    setError(null);
    const mail = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    if (password.length < 6) {
      setError("6 caractères minimum pour le mot de passe.");
      return;
    }
    setBusy("email");
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setPendingConfirm(true);
          toast.success("Compte créé. Vérifie ta boîte mail pour confirmer.");
          return;
        }
        toast.success("Compte créé");
        onAuthenticated?.();
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (err) throw err;
        toast.success("Connecté");
        onAuthenticated?.();
      }
    } catch (e) {
      const msg = frError(e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setError(null);
    setBusy(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!("redirected" in result && result.redirected)) onAuthenticated?.();
    } catch (e) {
      setError(frError(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(null);
    }
  };

  if (pendingConfirm) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-arena-border bg-arena-surface p-5 text-center">
          <Mail size={22} className="mx-auto text-arena-gold" />
          <p className="mt-3 text-sm font-black text-foreground">Confirme ton e-mail</p>
          <p className="mt-2 text-xs leading-relaxed text-arena-sub">
            Un lien a été envoyé à <span className="text-foreground">{email}</span>. Clique dessus puis reviens ici.
          </p>
        </div>
        <button
          onClick={() => { setPendingConfirm(false); setMode("login"); }}
          className="text-center text-xs font-semibold text-arena-sub"
        >
          J'ai confirmé, me connecter
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ProviderBtn icon={Apple} label="Continuer avec Apple" highlight loading={busy === "apple"} onClick={() => oauth("apple")} />
      <ProviderBtn icon={Mail} label="Continuer avec Google" loading={busy === "google"} onClick={() => oauth("google")} />

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-arena-border" />
        <span className="text-xs text-arena-muted">ou</span>
        <div className="h-px flex-1 bg-arena-border" />
      </div>

      <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="toi@exemple.com" autoComplete="email" />
      <Field
        label="Mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-destructive" />
          <span className="text-[11px] leading-relaxed text-destructive">{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={submitEmail}
        disabled={busy !== null}
        className="flex h-13 min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black uppercase tracking-wide text-arena-foreground transition active:scale-[0.98] disabled:opacity-60"
      >
        {busy === "email" ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        {mode === "signup" ? "Créer mon compte" : "Me connecter"}
      </button>

      <button
        type="button"
        onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}
        className="mt-1 text-center text-xs font-semibold text-arena-sub transition-colors hover:text-foreground"
      >
        {mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"}
      </button>

      <p className="mt-1 text-center text-[10px] leading-relaxed text-arena-muted">
        En continuant, tu acceptes les <span className="text-arena-sub underline">CGU</span> et la{" "}
        <span className="text-arena-sub underline">politique de confidentialité</span>.
      </p>
    </div>
  );
}

function ProviderBtn({
  icon: Icon,
  label,
  highlight,
  loading,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  highlight?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-5 text-sm font-bold text-foreground transition-transform active:scale-[0.98] disabled:opacity-60
        ${highlight ? "border-arena/40 bg-arena/10" : "border-arena-border bg-arena-surface"}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
      {label}
    </button>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4 focus-within:border-arena/50">
      <label className="text-xs text-arena-sub">{label}</label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent font-bold text-foreground outline-none placeholder:text-arena-muted"
      />
    </div>
  );
}
