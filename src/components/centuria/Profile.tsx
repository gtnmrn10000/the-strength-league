import { useState, useEffect } from "react";
import { MapPin, ShieldCheck, Settings, Trophy, Flame, Dumbbell, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { loadUserProfile, goalLabel, goalEmoji, leagueLabel, leagueColor } from "./userProfile";
import LeagueIcon from "./LeagueIcon";
import { supabase } from "@/integrations/supabase/client";
import { GRADES, GRADE_LABELS, GRADE_EMOJIS, type Grade } from "@/lib/grades";

interface DbProfile {
  xp: number;
  current_grade: string;
  last_pr_at: string | null;
  poids: number | null;
}

interface VerifiedPR {
  exercise: string;
  weight_kg: number;
  reps: number;
  created_at: string;
}

export default function Profile() {
  const profile = loadUserProfile();
  const lc = leagueColor(profile?.league ?? null);

  const [dbProfile, setDbProfile] = useState<DbProfile | null>(null);
  const [verifiedPRs, setVerifiedPRs] = useState<VerifiedPR[]>([]);
  const [prCount, setPrCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [profileRes, prsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("xp, current_grade, last_pr_at, poids")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("prs")
          .select("exercise, weight_kg, reps, created_at")
          .eq("user_id", user.id)
          .eq("status", "verified")
          .order("created_at", { ascending: false }),
      ]);

      if (!cancelled) {
        if (profileRes.data) setDbProfile(profileRes.data as DbProfile);
        if (prsRes.data) {
          setVerifiedPRs(prsRes.data as VerifiedPR[]);
          setPrCount(prsRes.data.length);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const grade = (dbProfile?.current_grade || "recruit") as Grade;
  const xp = dbProfile?.xp ?? 0;
  const nextGradeIdx = Math.min(GRADES.indexOf(grade) + 1, GRADES.length - 1);
  const nextGrade = GRADES[nextGradeIdx];
  const isMaxGrade = grade === "legende";

  // XP thresholds per grade (rough: 500 XP per PR, ~3 PRs per grade)
  const xpPerGrade = 1500;
  const currentGradeBaseXp = GRADES.indexOf(grade) * xpPerGrade;
  const progressXp = xp - currentGradeBaseXp;
  const progressPct = isMaxGrade ? 100 : Math.min(100, Math.round((progressXp / xpPerGrade) * 100));

  // Best PRs per exercise
  const bestPRs: Record<string, VerifiedPR> = {};
  for (const pr of verifiedPRs) {
    if (!bestPRs[pr.exercise] || pr.weight_kg > bestPRs[pr.exercise].weight_kg) {
      bestPRs[pr.exercise] = pr;
    }
  }

  return (
    <div className="px-4 pt-2 pb-4">
      <CombatCard
        profile={profile}
        lc={lc}
        grade={grade}
        xp={xp}
        prCount={prCount}
        bestPRs={bestPRs}
        bodyweight={dbProfile?.poids ?? null}
      />

      {/* XP + Grade progression */}
      <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">PROGRESSION</h3>
      <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            {GRADE_EMOJIS[grade]} {GRADE_LABELS[grade]}
          </span>
          {!isMaxGrade && (
            <span className="text-xs text-arena-sub">
              → {GRADE_EMOJIS[nextGrade]} {GRADE_LABELS[nextGrade]}
            </span>
          )}
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-arena"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="flex items-center gap-1 text-xs text-arena-muted">
            <Zap size={12} className="text-arena-gold" />
            <span className="font-bold text-arena-gold">{xp.toLocaleString()}</span> XP
          </p>
          <p className="text-[10px] text-arena-muted">
            {isMaxGrade ? "Grade maximum atteint !" : `${progressPct}%`}
          </p>
        </div>
      </div>

      {/* Per-exercise progress to next grade */}
      {dbProfile?.poids && dbProfile.poids > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-[10px] font-black tracking-widest text-arena-muted">PROGRESSION PAR EXERCICE</h4>
          {(["squat", "bench", "deadlift"] as const).map((ex) => {
            const bestPR = bestPRs[ex];
            const currentWeight = bestPR?.weight_kg ?? 0;
            const bw = dbProfile.poids!;
            const ratio = currentWeight / bw;
            const thresholds = THRESHOLDS[ex];
            // Find current grade index for this lift
            let currentIdx = 0;
            for (let i = thresholds.length - 1; i >= 0; i--) {
              if (ratio >= thresholds[i]) { currentIdx = i; break; }
            }
            const isMax = currentIdx >= thresholds.length - 1;
            const nextThreshold = isMax ? thresholds[thresholds.length - 1] : thresholds[currentIdx + 1];
            const prevThreshold = thresholds[currentIdx];
            const range = nextThreshold - prevThreshold;
            const pct = isMax ? 100 : range > 0 ? Math.min(100, Math.round(((ratio - prevThreshold) / range) * 100)) : 0;
            const nextGradeForLift = isMax ? GRADES[currentIdx] : GRADES[currentIdx + 1];
            const nextWeightNeeded = isMax ? null : Math.ceil(nextThreshold * bw);
            const exLabels: Record<string, string> = { squat: "Squat", bench: "Bench", deadlift: "Deadlift" };

            return (
              <div key={ex} className="rounded-xl border border-arena-border bg-secondary p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{exLabels[ex]}</span>
                  <span className="text-arena-sub">
                    {isMax
                      ? `${GRADE_EMOJIS[nextGradeForLift]} MAX`
                      : `→ ${GRADE_EMOJIS[nextGradeForLift]} ${GRADE_LABELS[nextGradeForLift]}`}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background">
                  <motion.div
                    className="h-full rounded-full bg-arena"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-arena-sub">
                  <span>{currentWeight > 0 ? `${currentWeight}kg (${ratio.toFixed(2)}× BW)` : "Aucun PR"}</span>
                  <span>{isMax ? "🏆" : `${nextWeightNeeded}kg requis`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Last level-up info */}
      {dbProfile?.last_pr_at && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl border border-arena-gold/30 bg-arena-gold/5 p-3"
        >
          <p className="flex items-center gap-2 text-xs text-arena-gold">
            <Trophy size={14} />
            <span className="font-bold">Dernier PR :</span>{" "}
            {new Date(dbProfile.last_pr_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </motion.div>
      )}

      {profile?.goal && (
        <>
          <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">OBJECTIF ACTUEL</h3>
          <div className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-4">
            <span className="text-2xl">{goalEmoji(profile.goal)}</span>
            <div>
              <p className="font-black text-foreground">{goalLabel(profile.goal)}</p>
              <p className="text-xs text-arena-sub">Défini à l'inscription · Modifiable dans les réglages</p>
            </div>
          </div>
        </>
      )}

      <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">BADGES</h3>
      <div className="flex flex-wrap gap-2">
        <Badge label={GRADE_LABELS[grade]} />
        {prCount >= 1 && <Badge label="1er PR" />}
        {prCount >= 5 && <Badge label="5 PRs" />}
        {prCount >= 10 && <Badge label="Décathlon" />}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-arena/10 px-3 py-1.5">
      <Target size={12} className="text-arena" />
      <span className="text-[10px] font-bold text-arena">{label}</span>
    </div>
  );
}

function CombatCard({
  profile,
  lc,
  grade,
  xp,
  prCount,
  bestPRs,
  bodyweight,
}: {
  profile: ReturnType<typeof loadUserProfile>;
  lc: { text: string; bg: string };
  grade: Grade;
  xp: number;
  prCount: number;
  bestPRs: Record<string, { exercise: string; weight_kg: number; reps: number }>;
  bodyweight: number | null;
}) {
  const pseudo = profile?.pseudo || "Gladiateur";
  const age = profile?.age ? `${profile.age} ans` : "";
  const poids = profile?.poids ? `${profile.poids}kg` : "";
  const meta = [age, poids].filter(Boolean).join(" · ");

  const exerciseLabels: Record<string, string> = {
    squat: "Squat",
    bench: "Bench",
    deadlift: "Deadlift",
  };

  const hasPRs = Object.keys(bestPRs).length > 0;

  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">{pseudo}</h2>
          <p className="text-xs text-arena-sub">@{pseudo.toLowerCase().replace(/\s/g, "_")}</p>
          {meta && (
            <p className="mt-1 flex items-center gap-1 text-xs text-arena-sub">
              <MapPin size={12} /> {meta}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl">{GRADE_EMOJIS[grade]}</span>
          <span className="mt-0.5 text-[10px] font-bold text-arena">{GRADE_LABELS[grade]}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        <Mini icon={Flame} label="XP" value={xp.toLocaleString()} />
        <Mini icon={Dumbbell} label="PRs" value={String(prCount)} />
        <Mini icon={Trophy} label="Grade" value={GRADE_LABELS[grade]} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {profile?.league && (
          <span className={`flex items-center gap-1.5 rounded-full ${lc.bg} px-2 py-0.5 text-[10px] font-bold ${lc.text}`}>
            <LeagueIcon league={profile.league} size="xs" /> Ligue {leagueLabel(profile.league)}
          </span>
        )}
        <span className="rounded-full bg-arena/10 px-2 py-0.5 text-[10px] font-bold text-arena">
          {GRADE_EMOJIS[grade]} {GRADE_LABELS[grade].toUpperCase()}
        </span>
      </div>

      {profile?.league === "naturelle" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-arena-green">
          <ShieldCheck size={14} />
          <span>Drug-free — En attente de vérification</span>
        </div>
      )}
      {profile?.league === "olympien" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-arena-purple">
          <Flame size={14} />
          <span>Olympien — Aucune limite, force absolue</span>
        </div>
      )}

      <h4 className="mb-2 mt-4 text-xs font-black text-arena-muted">PR VÉRIFIÉS</h4>
      {hasPRs ? (
        <div className="flex flex-col gap-2">
          {(["squat", "bench", "deadlift"] as const).map((ex) => {
            const pr = bestPRs[ex];
            if (!pr) return null;
            const ratio = bodyweight ? (pr.weight_kg / bodyweight).toFixed(2) : null;
            return (
              <motion.div
                key={ex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl border border-arena-border bg-secondary p-3"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{exerciseLabels[ex]}</p>
                  {ratio && (
                    <p className="text-[10px] text-arena-sub">Ratio {ratio}× BW</p>
                  )}
                </div>
                <span className="font-[Anton] text-lg text-arena">
                  {pr.weight_kg}kg
                </span>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-secondary p-4 text-center">
          <p className="text-xs text-arena-muted">Aucun PR enregistré pour le moment.</p>
          <p className="mt-1 text-[10px] text-arena-sub">Log ton premier PR pour commencer 💪</p>
        </div>
      )}

      <button className="mt-4 w-full rounded-xl border border-arena-border py-2 text-xs font-bold text-arena-sub">
        Partager ma carte
      </button>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <Icon size={16} className="text-arena" />
      <span className="mt-1 text-sm font-black text-foreground">{value}</span>
      <span className="text-[10px] text-arena-sub">{label}</span>
    </div>
  );
}
