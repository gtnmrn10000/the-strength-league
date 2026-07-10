import {
  Award,
  TrendingUp,
  Flame,
  Target,
  Trophy,
  Medal,
  Zap,
  Sparkles,
  Footprints,
  Dumbbell,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { GRADES, type Grade } from "./grades";

/**
 * Unified grade icon: one shape (Award) for all 8 tiers.
 * Higher tiers get more fill and stronger gold saturation, so the
 * hierarchy is readable at a glance without switching icons.
 */
export function GradeIcon({
  grade,
  size = 14,
  className = "",
}: {
  grade: Grade;
  size?: number;
  className?: string;
}) {
  const tier = Math.max(0, GRADES.indexOf(grade)); // 0..7
  // Progressive fill from recruit (none) to legende (full)
  const fillOpacity = tier / (GRADES.length - 1); // 0 → 1
  // Neutral gray for the lowest tier, gold from tier 1+
  const color = tier === 0 ? "var(--arena-muted, #8A8578)" : "var(--arena-gold, #D4AF37)";
  return (
    <Award
      size={size}
      className={className}
      color={color}
      fill={color}
      fillOpacity={fillOpacity}
      strokeWidth={2}
    />
  );
}

/** Kept for compatibility; single shape now (Award). */
export const GRADE_ICON: Record<Grade, LucideIcon> = {
  recruit: Award,
  soldat: Award,
  guerrier: Award,
  spartiate: Award,
  gladiateur: Award,
  centurion: Award,
  titan: Award,
  legende: Award,
};

/** Goals — semantic Lucide icons. */
export const GOAL_ICON: Record<string, LucideIcon> = {
  masse: TrendingUp,     // prise de masse = progression
  seche: Flame,          // sèche / perte de gras = brûler
  performance: Target,   // performance = viser un objectif
};

export function GoalIcon({
  goal,
  size = 14,
  className = "",
}: {
  goal: string | null;
  size?: number;
  className?: string;
}) {
  const Icon = (goal && GOAL_ICON[goal]) || Target;
  return <Icon size={size} className={className} />;
}

/** PR / achievement icons. */
export const PR_ICON: LucideIcon = Trophy;
export const MEDAL_ICON: LucideIcon = Medal;
export const STREAK_ICON: LucideIcon = Flame;
export const XP_ICON: LucideIcon = Zap;
export const PRO_ICON: LucideIcon = Sparkles;

/** Lucide icon for the 3 main PR lifts. */
export const EXERCISE_ICON: Record<string, LucideIcon> = {
  squat: Footprints,
  bench: Dumbbell,
  deadlift: Weight,
};

export function ExerciseIcon({
  exercise,
  size = 14,
  className = "",
}: {
  exercise: string;
  size?: number;
  className?: string;
}) {
  const Icon = EXERCISE_ICON[exercise] ?? Dumbbell;
  return <Icon size={size} className={className} />;
}
