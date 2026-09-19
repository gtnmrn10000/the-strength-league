import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Download,
  FileText,
  KeyRound,
  LifeBuoy,
  Loader2,
  Mail,
  Shield,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount, exportMyData, DELETE_CONFIRM_PHRASE } from "@/lib/api";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

function frError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("current password")) return "Mot de passe actuel incorrect.";
  if (m.includes("same password")) return "Choisis un mot de passe différent de l'ancien.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (m.includes("unauthorized") || m.includes("401")) return "Session expirée. Reconnecte-toi.";
  return message;
}

export default function AccountSection({ onSignedOut }: { onSignedOut?: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Suppression : double confirmation (1. intention, 2. phrase exacte).
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const changePassword = async () => {
    if (newPwd.length < 6) {
      toast.error("6 caractères minimum pour le nouveau mot de passe.");
      return;
    }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPwd,
        // Requis par Lovable Cloud pour un changement en session active.
        ...(currentPwd ? { current_password: currentPwd } : {}),
      } as Parameters<typeof supabase.auth.updateUser>[0]);
      if (error) throw error;
      toast.success("Mot de passe mis à jour.");
      setShowPwd(false);
      setCurrentPwd("");
      setNewPwd("");
    } catch (e) {
      toast.error(frError(e instanceof Error ? e.message : String(e)));
    } finally {
      setSavingPwd(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("E-mail de réinitialisation envoyé.");
    } catch (e) {
      toast.error(frError(e instanceof Error ? e.message : String(e)));
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `centuria-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé.");
    } catch (e) {
      toast.error(frError(e instanceof Error ? e.message : "Export impossible"));
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (confirmText.trim().toUpperCase() !== DELETE_CONFIRM_PHRASE) {
      toast.error(`Tape exactement ${DELETE_CONFIRM_PHRASE} pour confirmer.`);
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount(DELETE_CONFIRM_PHRASE);
      track("account_deleted");
      await supabase.auth.signOut();
      localStorage.removeItem("centuria_onboarded");
      localStorage.removeItem("centuria_profile");
      localStorage.removeItem("centuria_onboarding");
      toast.success("Compte supprimé.");
      onSignedOut?.();
      window.location.href = "/";
    } catch (e) {
      toast.error(frError(e instanceof Error ? e.message : "Suppression impossible"));
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Compte */}
      <div>
        <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-arena-muted">COMPTE</p>
        <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-arena" />
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-widest text-arena-muted">E-MAIL</p>
              <p className="truncate text-sm font-bold text-foreground">{email ?? "—"}</p>
            </div>
          </div>

          {!showPwd ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setShowPwd(true)}
                className="flex items-center gap-1.5 rounded-full border border-arena-border px-3 py-2 text-[11px] font-black text-foreground active:scale-95"
              >
                <KeyRound size={12} /> Changer le mot de passe
              </button>
              <button
                onClick={forgotPassword}
                className="rounded-full px-3 py-2 text-[11px] font-bold text-arena-sub active:scale-95"
              >
                Mot de passe oublié
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Mot de passe actuel"
                autoComplete="current-password"
                className="h-11 rounded-xl border border-arena-border bg-background px-3 text-sm text-foreground outline-none focus:border-arena"
              />
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Nouveau mot de passe"
                autoComplete="new-password"
                className="h-11 rounded-xl border border-arena-border bg-background px-3 text-sm text-foreground outline-none focus:border-arena"
              />
              <div className="flex gap-2">
                <button
                  onClick={changePassword}
                  disabled={savingPwd}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-arena text-[12px] font-black uppercase tracking-wide text-arena-foreground disabled:opacity-60"
                >
                  {savingPwd && <Loader2 size={13} className="animate-spin" />} Enregistrer
                </button>
                <button
                  onClick={() => { setShowPwd(false); setCurrentPwd(""); setNewPwd(""); }}
                  className="h-11 rounded-xl border border-arena-border px-4 text-[12px] font-bold text-arena-sub"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Données */}
      <div>
        <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-arena-muted">
          MES DONNÉES
        </p>
        <button
          onClick={exportData}
          disabled={exporting}
          className="flex w-full items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-3 active:scale-[0.99] disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            {exporting ? (
              <Loader2 size={16} className="animate-spin text-arena" />
            ) : (
              <Download size={16} className="text-arena" />
            )}
            Exporter mes données (JSON)
          </span>
        </button>
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-arena-muted">
          Profil, séances, nutrition, pesées, records et posts.
        </p>
      </div>

      {/* Légal */}
      <div>
        <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-arena-muted">
          INFORMATIONS LÉGALES
        </p>
        <div className="flex flex-col gap-2">
          <LegalLink to="/legal/privacy" icon={Shield} label="Politique de confidentialité" />
          <LegalLink to="/legal/terms" icon={FileText} label="Conditions générales" />
          <LegalLink to="/legal/support" icon={LifeBuoy} label="Contact & support" />
        </div>
      </div>

      {/* Zone dangereuse */}
      <div>
        <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-red-400/80">
          ZONE DANGEREUSE
        </p>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          {deleteStep === 0 && (
            <button
              onClick={() => setDeleteStep(1)}
              className="flex w-full items-center justify-center gap-2 text-sm font-black tracking-wide text-red-400"
            >
              <Trash2 size={14} /> Supprimer mon compte
            </button>
          )}

          {deleteStep === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-[11px] leading-relaxed text-foreground/85">
                  Cette action est définitive. Tes séances, ta nutrition, tes records, tes vidéos,
                  tes posts et ton profil seront supprimés. Les aliments que tu as ajoutés à la base
                  partagée seront conservés de façon anonyme.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteStep(2)}
                  className="h-11 flex-1 rounded-xl border border-red-500/40 text-[12px] font-black text-red-400"
                >
                  Je comprends, continuer
                </button>
                <button
                  onClick={() => setDeleteStep(0)}
                  className="h-11 rounded-xl border border-arena-border px-4 text-[12px] font-bold text-arena-sub"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] leading-relaxed text-foreground/85">
                Dernière étape : tape <span className="font-black">{DELETE_CONFIRM_PHRASE}</span>{" "}
                pour confirmer.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={DELETE_CONFIRM_PHRASE}
                autoCapitalize="characters"
                className="h-11 rounded-xl border border-red-500/40 bg-background px-3 text-sm font-black tracking-widest text-foreground outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-[12px] font-black uppercase tracking-wide text-white disabled:opacity-60"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Supprimer définitivement
                </button>
                <button
                  onClick={() => { setDeleteStep(0); setConfirmText(""); }}
                  className="h-11 rounded-xl border border-arena-border px-4 text-[12px] font-bold text-arena-sub"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegalLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-3 text-sm font-bold text-foreground active:scale-[0.99]"
    >
      <Icon size={16} className="text-arena" />
      {label}
    </Link>
  );
}
