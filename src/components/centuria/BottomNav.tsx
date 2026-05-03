import { motion } from "framer-motion";
import { Home, Dumbbell, Utensils, Swords, User } from "lucide-react";

const tabs = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "training", label: "Training", icon: Dumbbell },
  { id: "meals", label: "Repas", icon: Utensils },
  { id: "rank", label: "Guerre", icon: Swords },
  { id: "profile", label: "Profil", icon: User },
];

export default function BottomNav({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-arena-border bg-background/95 px-2 py-2 backdrop-blur-md">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActive(t.id)}
            className="flex flex-col items-center justify-center gap-1"
          >
            <Icon size={20} className={on ? "text-arena" : "text-arena-muted"} />
            <span className={`text-[10px] font-bold ${on ? "text-arena" : "text-arena-muted"}`}>{t.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
