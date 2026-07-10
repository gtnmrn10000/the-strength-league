import { useState, useEffect } from "react";
import { Camera, NotebookPen, Target, Sparkles, ChevronRight, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CoachSheet from "./coach/CoachSheet";
import PremiumBadge from "./paywall/PremiumBadge";
import WorkoutLogger from "./WorkoutLogger";
import GoalEditor from "./GoalEditor";

interface VerifiedPR {
  exercise: string;
  weight_kg: number;
  reps: number;
  created_at: string;
}

export default function Training({ onPR, refreshKey }: { onPR: () => void; refreshKey?: number }) {
  const [bestPRs, setBestPRs] = useState<Record<string, VerifiedPR>>({});
  const [bodyweight, setBodyweight] = useState<number | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [localTick, setLocalTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [profileRes, prsRes] = await Promise.all([
        supabase.rpc("get_my_profile").maybeSingle(),
        supabase
          .from("prs")
          .select("exercise, weight_kg, reps, created_at")
          .eq("user_id", user.id)
          .eq("status", "verified")
          .order("weight_kg", { ascending: false }),
      ]);

      if (cancelled) return;
      if ((profileRes.data as any)?.poids) setBodyweight(Number((profileRes.data as any).poids));

      if (prsRes.data) {
        const bests: Record<string, VerifiedPR> = {};
        for (const pr of prsRes.data as VerifiedPR[]) {
          if (!bests[pr.exercise] || pr.weight_kg > bests[pr.exercise].weight_kg) {
            bests[pr.exercise] = pr;
          }
        }
        setBestPRs(bests);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, localTick]);

  const exerciseLabels: Record<string, string> = { squat: "Squat", bench: "Bench Press", deadlift: "Deadlift" };
  const hasPRs = Object.keys(bestPRs).length > 0;

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ActionCard icon={Camera} title="Log un PR" glow onClick={onPR} />
        <ActionCard icon={NotebookPen} title="Log séance" />
        <ActionCard icon={Target} title="Mes objectifs" />
        <ActionCard icon={Sparkles} title="Coach IA" premium onClick={() => setCoachOpen(true)} />
      </div>
      <CoachSheet
        open={coachOpen}
        onOpenChange={setCoachOpen}
        onSessionStarted={() => setLocalTick((k) => k + 1)}
      />

      <SectionTitle>TES PR ACTUELS</SectionTitle>
      {hasPRs ? (
        <div className="flex flex-col gap-3">
          {(["squat", "bench", "deadlift"] as const).map((ex) => {
            const pr = bestPRs[ex];
            if (!pr) return null;
            const ratio = bodyweight ? (pr.weight_kg / bodyweight).toFixed(2) : null;
            return (
              <div key={ex} className="flex items-center justify-between rounded-2xl border border-arena-border bg-arena-surface p-4">
                <div>
                  <p className="font-black text-foreground">{exerciseLabels[ex]}</p>
                  {ratio && <p className="text-xs text-arena-sub">Ratio {ratio}× BW</p>}
                </div>
                <span className="text-xl font-black text-arena">{pr.weight_kg}kg</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-arena-border bg-arena-surface p-4 text-center">
          <p className="text-sm text-arena-muted">Aucun PR enregistré</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-arena-sub">Log ton premier PR pour commencer <Dumbbell size={12} className="text-arena" /></p>
        </div>
      )}

      <SectionTitle>PROGRAMME IA RECOMMANDÉ</SectionTitle>
      <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <p className="font-black text-foreground">Push Force · Grade Spartiate</p>
        <p className="mt-1 text-xs text-arena-sub">
          Séance optimisée pour passer Gladiateur Bench sous 21 jours.
        </p>
        <button className="mt-3 flex items-center gap-1 text-sm font-bold text-arena">
          Démarrer <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, glow, premium, onClick }: { icon: React.ElementType; title: string; glow?: boolean; premium?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-4 active:scale-95 transition-transform ${glow ? "shadow-[0_0_20px_var(--arena-glow)]" : ""}`}
    >
      {premium && <PremiumBadge className="absolute right-1.5 top-1.5" />}
      <Icon size={22} className={glow ? "text-arena" : "text-arena-sub"} />
      <span className="text-xs font-bold text-foreground">{title}</span>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">{children}</h3>;
}
