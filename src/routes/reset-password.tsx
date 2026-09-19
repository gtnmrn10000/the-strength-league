import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Centuria" },
      { name: "description", content: "Choisis un nouveau mot de passe pour ton compte Centuria." },
      { property: "og:title", content: "Nouveau mot de passe — Centuria" },
      { property: "og:description", content: "Réinitialise l'accès à ton compte Centuria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Le lien de récupération pose la session via le hash de l'URL.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }
      if (!window.location.hash.includes("type=recovery")) {
        setError("Lien invalide ou expiré. Redemande un e-mail de réinitialisation.");
      }
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setReady(true);
        setError(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 6) {
      setError("6 caractères minimum.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Session de récupération : pas de current_password ici.
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      toast.success("Mot de passe mis à jour.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de mettre à jour le mot de passe.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 bg-background px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <h1 className="text-xl font-black text-foreground">Nouveau mot de passe</h1>
      <p className="text-sm text-arena-sub">
        Choisis un nouveau mot de passe pour ton compte Centuria.
      </p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••"
        autoComplete="new-password"
        className="h-12 rounded-xl border border-arena-border bg-arena-surface px-3 text-sm text-foreground outline-none focus:border-arena"
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-destructive" />
          <span className="text-[11px] leading-relaxed text-destructive">{error}</span>
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy || !ready}
        className="flex h-13 min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black uppercase tracking-wide text-arena-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
        Mettre à jour
      </button>

      <button
        onClick={() => navigate({ to: "/" })}
        className="text-center text-xs font-semibold text-arena-sub"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
