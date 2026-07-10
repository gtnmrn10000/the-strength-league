import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PLANS, PREMIUM_FEATURES, type PlanId } from "@/lib/paywall/plans";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

const REASON_COPY: Record<string, { title: string; subtitle: string }> = {
  coach: {
    title: "Débloque le Coach IA",
    subtitle: "Chat illimité, séances perso et suivi de récupération.",
  },
  "photo-ia": {
    title: "Scan photo IA",
    subtitle: "Prends une photo de ton assiette, on remplit les macros.",
  },
  analyse: {
    title: "Analyse avancée",
    subtitle: "Détection de plateau et prédiction de PR.",
  },
  generic: {
    title: "Passe à Centuria Premium",
    subtitle: "Débloque tout le potentiel de ton entraînement.",
  },
};

export default function Paywall() {
  const { paywallOpen, closePaywall, paywallReason, purchase, purchasing, restore, isPremium } = useSubscription();
  const [selected, setSelected] = useState<PlanId>("centuria_yearly");
  const copy = REASON_COPY[paywallReason] ?? REASON_COPY.generic;

  const handlePurchase = async () => {
    try {
      await purchase(selected);
      toast.success("Bienvenue dans Centuria Premium 🔥");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Achat impossible.";
      toast.error(msg);
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      toast.success(isPremium ? "Abonnement restauré." : "Aucun abonnement actif.");
    } catch {
      toast.error("Restauration impossible.");
    }
  };

  return (
    <Sheet open={paywallOpen} onOpenChange={(v) => !v && closePaywall()}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <button
          onClick={closePaywall}
          className="absolute right-3 top-3 z-10 rounded-full bg-arena-surface p-2 text-arena-muted"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="bg-gradient-to-b from-arena/20 via-background to-background px-6 pt-10 pb-6">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-arena px-3 py-1 text-[10px] font-black tracking-widest text-arena-on">
              <Sparkles size={12} /> PREMIUM
            </div>
            <h2 className="text-2xl font-black leading-tight text-foreground">{copy.title}</h2>
            <p className="mt-2 text-sm text-arena-muted">{copy.subtitle}</p>
          </div>

          <ul className="space-y-3 px-6 py-4">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-arena/20">
                  <Check size={12} className="text-arena" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{f.title}</div>
                  <div className="text-xs text-arena-muted">{f.description}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-2 px-6 pb-4">
            {PLANS.map((p) => {
              const active = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-arena bg-arena/10"
                      : "border-arena-border bg-arena-surface"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground">{p.label}</span>
                      {p.badge && (
                        <span className="rounded-full bg-arena px-1.5 py-0.5 text-[9px] font-black text-arena-on">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    {p.pricePerMonthLabel && (
                      <div className="mt-0.5 text-[11px] text-arena-muted">{p.pricePerMonthLabel}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-foreground">{p.priceLabel}</div>
                    <div className="text-[10px] text-arena-muted">/ {p.period}</div>
                    {p.savings && (
                      <div className="mt-0.5 text-[10px] font-black text-arena">{p.savings}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-arena-border bg-background px-6 py-4">
          <button
            onClick={handlePurchase}
            disabled={purchasing !== null}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black tracking-widest text-arena-on disabled:opacity-60"
          >
            {purchasing ? <Loader2 size={16} className="animate-spin" /> : null}
            {isPremium ? "GÉRER MON ABONNEMENT" : "S'ABONNER"}
          </button>
          <div className="mt-2 flex justify-center gap-4 text-[10px] text-arena-muted">
            <button onClick={handleRestore}>Restaurer un achat</button>
            <span>•</span>
            <span>Résiliable à tout moment</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
