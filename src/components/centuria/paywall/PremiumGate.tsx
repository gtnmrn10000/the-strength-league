import { Lock, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";

type Reason = "coach" | "photo-ia" | "analyse" | "generic";

/**
 * Wrapper de gating premium.
 *
 * - Si l'utilisateur est premium : rend `children`.
 * - Sinon : rend un état verrouillé avec CTA qui ouvre le paywall.
 *
 * Utilisation :
 *   <PremiumGate reason="coach"><CoachChat /></PremiumGate>
 *
 * Pour un check inline sans wrapping, utiliser `useSubscription()`
 * puis `openPaywall(reason)`.
 */
export default function PremiumGate({
  reason = "generic",
  title,
  description,
  children,
  fallback,
}: {
  reason?: Reason;
  title?: string;
  description?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isPremium, loading, openPaywall } = useSubscription();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-arena border-t-transparent" />
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-arena/20 p-4">
        <Lock className="text-arena" size={32} />
      </div>
      <div>
        <h3 className="text-lg font-black text-foreground">
          {title ?? "Fonctionnalité Premium"}
        </h3>
        <p className="mt-1 max-w-xs text-sm text-arena-muted">
          {description ?? "Passe à Centuria Premium pour débloquer cette fonctionnalité."}
        </p>
      </div>
      <button
        onClick={() => openPaywall(reason)}
        className="inline-flex items-center gap-2 rounded-2xl bg-arena px-5 py-3 text-xs font-black tracking-widest text-arena-on active:scale-[0.98]"
      >
        <Sparkles size={14} />
        DÉBLOQUER PREMIUM
      </button>
    </div>
  );
}
