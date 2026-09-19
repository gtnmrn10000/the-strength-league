import { Check, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PLANS, PREMIUM_FEATURES, planById, type PlanId } from "@/lib/paywall/plans";
import { STUDENT_BLOCKER_COPY } from "@/lib/paywall/eligibility";
import { useSubscription } from "@/hooks/useSubscription";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

const REASON_COPY: Record<string, { title: string; subtitle: string }> = {
  coach: {
    title: "Débloque le Coach",
    subtitle: "Chat illimité, séances perso, récupération musculaire.",
  },
  "photo-ia": {
    title: "Analyse photo",
    subtitle: "Photographie ton assiette, puis vérifie les quantités avant d'ajouter le repas.",
  },
  analyse: {
    title: "Analyse avancée",
    subtitle: "Détection de plateau, prédiction de PR, rapport hebdo.",
  },
  recipes: {
    title: "Recettes personnalisées",
    subtitle: "Recettes générées pour tes objectifs et macros restantes.",
  },
  video: {
    title: "Feedback vidéo",
    subtitle: "Retour détaillé sur ton exécution à partir d'une vidéo.",
  },
  generic: {
    title: "Centuria Premium",
    subtitle: "Coach et suivi avancé de progression.",
  },
};

export default function Paywall() {
  const {
    paywallOpen,
    closePaywall,
    paywallReason,
    purchase,
    restore,
    purchasing,
    mode,
    devUnlockEnabled,
    setupTodo,
    canPurchase,
    prices,
    studentOpen,
  } = useSubscription();
  const [selected, setSelected] = useState<PlanId>("centuria_standard");
  const [showTodo, setShowTodo] = useState(false);

  useEffect(() => {
    if (paywallOpen) track("paywall_viewed", { reason: paywallReason });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paywallOpen]);
  const copy = REASON_COPY[paywallReason] ?? REASON_COPY.generic;
  const isDev = mode === "dev";

  const selectedPlan = planById(selected);
  const studentBlocked = selectedPlan.requiresEligibility === "student" && !studentOpen;

  const handleSubscribe = async () => {
    if (studentBlocked && !isDev) {
      toast.error(STUDENT_BLOCKER_COPY);
      return;
    }
    if (!canPurchase && !isDev) {
      toast.error("L'abonnement s'achète dans l'app Centuria iOS ou Android.");
      return;
    }
    if (isDev && !devUnlockEnabled) {
      toast.error("Les achats ne sont pas encore branchés sur cet environnement.");
      return;
    }
    try {
      track("purchase_started", { plan: selected });
      await purchase(selected);
      toast.success(
        isDev ? "Accès Premium activé (mode dev, aucun paiement)." : "Abonnement activé."
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "L'achat a échoué.");
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      toast.success("Achats restaurés.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restauration impossible.");
    }
  };

  return (
    <Sheet open={paywallOpen} onOpenChange={(v) => !v && closePaywall()}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Centuria Premium</SheetTitle>
        </SheetHeader>
        <button
          onClick={closePaywall}
          className="absolute right-3 top-3 z-10 rounded-full bg-arena-surface p-2 text-arena-muted"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="border-b border-arena-border px-6 pb-6 pt-12">
            <p className="mb-3 text-xs font-semibold text-arena-gold">Premium</p>
            <h2 className="text-2xl font-black leading-tight text-foreground">{copy.title}</h2>
            <p className="mt-2 text-sm text-arena-muted">{copy.subtitle}</p>
          </div>

          <ul className="space-y-3 px-6 py-4">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-arena-gold">
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
                  className={`flex min-h-16 w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    active ? "border-arena-gold/60 bg-arena-gold/[0.04]" : "border-arena-border bg-arena-surface"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground">{p.label}</span>
                      {p.badge && (
                        <span className="text-[10px] font-semibold text-arena-gold">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    {p.note && (
                      <div className="mt-0.5 text-[11px] text-arena-muted">{p.note}</div>
                    )}
                    {p.requiresEligibility === "student" && !studentOpen && (
                      <div className="mt-0.5 text-[11px] text-arena-muted">
                        Bientôt disponible
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-foreground">
                      {prices[p.id] ?? p.referencePrice}
                    </div>
                    <div className="text-[10px] text-arena-muted">/ {p.period}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {isDev && (
            <div className="mx-6 mb-6 rounded-2xl border border-arena-border bg-arena-surface p-3">
              <p className="text-[11px] font-black tracking-widest text-arena-muted">
                MODE DÉVELOPPEMENT — AUCUN PAIEMENT
              </p>
              <p className="mt-1 text-[11px] text-arena-muted">
                Les achats in-app ne sont pas encore branchés sur cet environnement.
                {devUnlockEnabled
                  ? " Le bouton ci-dessous active l'accès Premium pour ton compte, sans facturation."
                  : " L'activation est désactivée ici."}
              </p>
              <button
                onClick={() => setShowTodo((v) => !v)}
                className="mt-2 text-[11px] font-bold text-arena underline"
              >
                {showTodo ? "Masquer" : "Voir ce qu'il reste à brancher"}
              </button>
              {showTodo && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-arena-muted">
                  {setupTodo.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-arena-border bg-background px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={handleSubscribe}
            disabled={purchasing !== null}
             className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background active:scale-[0.98] disabled:opacity-60"
          >
            {purchasing
              ? "Patiente…"
              : isDev
                ? "Activer — mode dev"
                : studentBlocked
                  ? "Bientôt disponible"
                  : "S'abonner"}
          </button>
          {!canPurchase && !isDev && (
            <p className="mt-2 text-center text-[11px] text-arena-muted">
              L'abonnement Centuria s'achète dans l'app iOS ou Android.
            </p>
          )}
          <div className="mt-2 flex justify-center gap-4 text-[10px] text-arena-muted">
            <button onClick={handleRestore}>Restaurer mes achats</button>
            <span>•</span>
            <span>Résiliable à tout moment</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
