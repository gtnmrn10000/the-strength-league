import { Home, Dumbbell, Users, Utensils, User } from "lucide-react";

const tabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "training", label: "Entraînement", icon: Dumbbell },
  { id: "community", label: "Communauté", icon: Users },
  { id: "meals", label: "Nutrition", icon: Utensils },
  { id: "profile", label: "Profil", icon: User },
];

export default function BottomNav({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-arena-border bg-background/95 px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            aria-current={on ? "page" : undefined}
            className="flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 active:scale-90 transition-transform"
          >
            <Icon size={20} className={on ? "text-arena" : "text-arena-muted"} />
            <span className={`max-w-full truncate text-center text-[9px] font-bold leading-tight ${on ? "text-arena" : "text-arena-muted"}`}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
