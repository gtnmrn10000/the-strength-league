import { Home, Dumbbell, Utensils, Trophy, User } from "lucide-react";

const tabs = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "training", label: "Entraînement", icon: Dumbbell },
  { id: "meals", label: "Repas", icon: Utensils },
  { id: "rank", label: "Classement", icon: Trophy },
  { id: "profile", label: "Profil", icon: User },
];

export default function BottomNav({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-arena-border bg-background/95 px-1 py-2 backdrop-blur-md">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            aria-current={on ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 active:scale-90 transition-transform"
          >
            <Icon size={20} className={on ? "text-arena" : "text-arena-muted"} />
            <span className={`max-w-full text-center text-[9px] font-bold leading-tight ${on ? "text-arena" : "text-arena-muted"}`}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
