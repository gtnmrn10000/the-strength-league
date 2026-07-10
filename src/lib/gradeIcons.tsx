import {
  Shield,
  Swords,
  Sword,
  ShieldHalf,
  Castle,
  Bird,
  Zap,
  Crown,
  Dumbbell,
  Flame,
  Target,
  Footprints,
  Weight,
  type LucideIcon,
} from "lucide-react";
import type { Grade } from "./grades";

/** Lucide icon component associated with each grade. */
export const GRADE_ICON: Record<Grade, LucideIcon> = {
  recruit: Shield,
  soldat: Swords,
  guerrier: Sword,
  spartiate: ShieldHalf,
  gladiateur: Castle,
  centurion: Bird,
  titan: Zap,
  legende: Crown,
};

export function GradeIcon({
  grade,
  size = 14,
  className = "",
}: {
  grade: Grade;
  size?: number;
  className?: string;
}) {
  const Icon = GRADE_ICON[grade] ?? Shield;
  return <Icon size={size} className={className} />;
}

/** Lucide icon for onboarding goals. */
export const GOAL_ICON: Record<string, LucideIcon> = {
  masse: Dumbbell,
  seche: Flame,
  performance: Zap,
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
