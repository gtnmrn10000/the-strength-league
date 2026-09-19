import {
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
/** Goals — semantic Lucide icons. */
export const GOAL_ICON: Record<string, LucideIcon> = {
  masse: TrendingUp,
  seche: Flame,
  performance: Target,
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

export const PR_ICON: LucideIcon = Trophy;
export const MEDAL_ICON: LucideIcon = Medal;
export const STREAK_ICON: LucideIcon = Flame;
export const XP_ICON: LucideIcon = Zap;
export const PRO_ICON: LucideIcon = Sparkles;

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
