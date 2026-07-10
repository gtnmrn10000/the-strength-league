import { Lock, Sparkles } from "lucide-react";

/**
 * Petit indicateur visuel PRO / cadenas cohérent partout dans l'app
 * pour marquer les entrées vers des fonctionnalités premium.
 *
 * - `variant="pro"` (par défaut) : pastille "PRO" avec ✨, positionnée en haut à droite.
 * - `variant="lock"` : petit cadenas discret.
 * - `unlocked` : masque le badge quand l'utilisateur est déjà abonné.
 */
export default function PremiumBadge({
  variant = "pro",
  unlocked = false,
  className = "",
}: {
  variant?: "pro" | "lock";
  unlocked?: boolean;
  className?: string;
}) {
  if (unlocked) return null;

  if (variant === "lock") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-arena-surface/90 p-1 text-arena-muted ${className}`}
        aria-label="Fonctionnalité premium"
      >
        <Lock size={10} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-arena px-1.5 py-0.5 text-[8px] font-black tracking-wider text-arena-on ${className}`}
      aria-label="Fonctionnalité premium"
    >
      <Sparkles size={8} />
      PRO
    </span>
  );
}
