import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Globe, Scale as ScaleIcon, Crown, LogOut, Info, Shield, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const UNITS_KEY = "centuria_units";
const LANG_KEY = "centuria_lang";

type Units = "metric" | "imperial";
type Lang = "fr" | "en";

export default function Settings({
  open,
  onOpenChange,
  onOpenWeighIns,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenWeighIns?: () => void;
}) {
  const { isPremium, openPaywall, refresh } = useSubscription();

  // Re-read entitlement chaque fois qu'on ouvre Paramètres — évite d'afficher
  // "Formule gratuite" si le flag a été flip côté DB pendant la session.
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);
  const [units, setUnits] = useState<Units>("metric");
  const [lang, setLang] = useState<Lang>("fr");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    const u = (localStorage.getItem(UNITS_KEY) as Units | null) ?? "metric";
    const l = (localStorage.getItem(LANG_KEY) as Lang | null) ?? "fr";
    setUnits(u);
    setLang(l);
  }, [open]);

  const persistUnits = (u: Units) => {
    setUnits(u);
    localStorage.setItem(UNITS_KEY, u);
    toast.success(u === "metric" ? "Unités : métrique (kg/cm)" : "Unités : impérial (lb/in)");
  };
  const persistLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem(LANG_KEY, l);
    toast.success(l === "fr" ? "Langue : Français" : "Language: English");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("centuria_onboarded");
      toast.success("Déconnecté");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de se déconnecter");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            PARAMÈTRES
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
          {/* Abonnement */}
          <Section title="ABONNEMENT">
            <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown size={20} className={isPremium ? "text-arena-gold" : "text-arena-muted"} />
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {isPremium ? "Centuria Premium" : "Formule gratuite"}
                    </p>
                    <p className="text-[11px] text-arena-sub">
                      {isPremium
                        ? "Accès complet : Coach IA, Photo IA, Analyse avancée"
                        : "Accède au Coach IA et à Photo IA"}
                    </p>
                  </div>
                </div>
                {!isPremium && (
                  <button
                    onClick={() => openPaywall("generic")}
                    className="rounded-full bg-arena-gold px-3 py-1.5 text-[10px] font-black tracking-widest text-black active:scale-95 transition"
                  >
                    UPGRADE
                  </button>
                )}
              </div>
            </div>
          </Section>

          {/* Suivi corporel */}
          {onOpenWeighIns && (
            <Section title="SUIVI CORPOREL">
              <button
                type="button"
                onClick={() => {
                  // Ferme Paramètres AVANT d'ouvrir Pesées — sinon les deux
                  // sheets s'empilent (Radix ne ferme pas automatiquement).
                  onOpenChange(false);
                  // Laisse l'animation de fermeture terminer avant d'ouvrir
                  // le suivant, sinon Radix garde le focus trap du 1er.
                  setTimeout(() => onOpenWeighIns(), 200);
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-3 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-2">
                  <ScaleIcon size={16} className="text-arena" />
                  <span className="text-sm font-bold text-foreground">Pesées & mensurations</span>
                </div>
                <ChevronRight size={16} className="text-arena-sub" />
              </button>
            </Section>
          )}


          {/* Unités */}
          <Section title="UNITÉS">
            <ToggleRow icon={ScaleIcon} label="Système">
              <SegBtn active={units === "metric"} onClick={() => persistUnits("metric")}>kg · cm</SegBtn>
              <SegBtn active={units === "imperial"} onClick={() => persistUnits("imperial")}>lb · in</SegBtn>
            </ToggleRow>
          </Section>

          {/* Langue */}
          <Section title="LANGUE">
            <ToggleRow icon={Globe} label="Interface">
              <SegBtn active={lang === "fr"} onClick={() => persistLang("fr")}>Français</SegBtn>
              <SegBtn active={lang === "en"} onClick={() => persistLang("en")}>English</SegBtn>
            </ToggleRow>
            <p className="mt-2 px-1 text-[10px] text-arena-muted">
              La traduction complète arrive prochainement.
            </p>
          </Section>

          {/* Légal */}
          <Section title="À PROPOS">
            <div className="flex flex-col gap-2">
              <LinkRow icon={Info} label="Version" value="1.0.0" />
              <LinkRow icon={Shield} label="Confidentialité" value="RGPD" />
            </div>
          </Section>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-black tracking-widest text-red-400 active:scale-[0.98] disabled:opacity-60"
          >
            {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            SE DÉCONNECTER
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-arena-muted">{title}</p>
      {children}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-arena" />
        <span className="text-sm font-bold text-foreground">{label}</span>
      </div>
      <div className="flex overflow-hidden rounded-full border border-arena-border bg-secondary">{children}</div>
    </div>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-black tracking-widest transition ${
        active ? "bg-arena-gold text-black" : "text-arena-sub"
      }`}
    >
      {children}
    </button>
  );
}

function LinkRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-arena-border bg-arena-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-arena-sub" />
        <span className="text-xs font-bold text-foreground">{label}</span>
      </div>
      <span className="text-[11px] text-arena-muted">{value}</span>
    </div>
  );
}
