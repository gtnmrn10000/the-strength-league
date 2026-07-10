import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Check, Dumbbell, Flame, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { saveUserProfile, loadUserProfile } from "./userProfile";

const GOALS = [
  { id: "masse", label: "Prise de masse", desc: "Surplus calorique, hypertrophie, progression de charge.", icon: Dumbbell },
  { id: "seche", label: "Sèche", desc: "Déficit calorique contrôlé, maintien de force, suivi macro.", icon: Flame },
  { id: "performance", label: "Performance", desc: "Force pure, peaking, ratios optimisés pour PR.", icon: Zap },
] as const;

export default function GoalEditor({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.rpc("get_my_profile").maybeSingle();
      const g = (data as { goal?: string | null } | null)?.goal ?? loadUserProfile()?.goal ?? null;
      setCurrent(g);
    })();
  }, [open]);

  const handleSelect = async (goal: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("profiles")
        .update({ goal: goal as "masse" | "seche" | "performance" })
        .eq("user_id", user.id);
      if (error) throw error;

      setCurrent(goal);
      const local = loadUserProfile();
      if (local) saveUserProfile({ ...local, goal });
      toast.success("Objectif mis à jour");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de mettre à jour l'objectif");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-md mx-auto bg-background border-arena-border">
        <SheetHeader>
          <SheetTitle className="text-sm font-black tracking-widest text-foreground">
            MES OBJECTIFS
          </SheetTitle>
        </SheetHeader>

        <p className="mt-2 text-xs text-arena-sub">
          Ton objectif détermine tes quêtes, ton XP et ton programme IA. Modifiable à tout moment.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {GOALS.map((g) => {
            const selected = current === g.id;
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => handleSelect(g.id)}
                disabled={saving}
                className={`w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98] disabled:opacity-60 ${
                  selected
                    ? "border-arena bg-arena/10 shadow-[0_0_20px_var(--arena-glow)]"
                    : "border-arena-border bg-arena-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={22} className="text-arena" />
                    <div>
                      <p className="font-black text-foreground">{g.label}</p>
                      <p className="mt-0.5 text-xs text-arena-sub">{g.desc}</p>
                    </div>
                  </div>
                  {selected && !saving && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arena">
                      <Check size={14} className="text-arena-foreground" />
                    </div>
                  )}
                  {saving && selected && <Loader2 size={16} className="animate-spin text-arena" />}
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
