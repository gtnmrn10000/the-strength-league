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
import { GRADES, type Grade } from "./grades";

import recrueAsset from "@/assets/grades/recrue.png.asset.json";
import soldatAsset from "@/assets/grades/soldat.png.asset.json";
import guerrierAsset from "@/assets/grades/guerrier.png.asset.json";
import spartiateAsset from "@/assets/grades/spartiate.png.asset.json";
import gladiateurAsset from "@/assets/grades/gladiateur.png.asset.json";
import centurionAsset from "@/assets/grades/centurion.png.asset.json";
import titanAsset from "@/assets/grades/titan.png.asset.json";
import legendeAsset from "@/assets/grades/legende.png.asset.json";
import divinAsset from "@/assets/grades/divin.png.asset.json";

export const GRADE_IMAGE: Record<Grade, string> = {
  recruit: recrueAsset.url,
  soldat: soldatAsset.url,
  guerrier: guerrierAsset.url,
  spartiate: spartiateAsset.url,
  gladiateur: gladiateurAsset.url,
  centurion: centurionAsset.url,
  titan: titanAsset.url,
  legende: legendeAsset.url,
  divin: divinAsset.url,
};

/**
 * Circular grade medal image with a gold border that thickens for top tiers.
 * Replaces the previous single-Award-shape icon system.
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
  const tier = Math.max(0, GRADES.indexOf(grade));
  // Top tiers (Titan, Légende, Divin) get a thicker gold ring.
  const borderWidth = tier >= 6 ? Math.max(2, Math.round(size * 0.09)) : 1;
  const glow =
    tier >= 7
      ? `0 0 ${Math.round(size * 0.35)}px rgba(212,175,55,0.55)`
      : tier >= 6
      ? `0 0 ${Math.round(size * 0.2)}px rgba(212,175,55,0.35)`
      : "none";
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${borderWidth}px solid var(--arena-gold, #D4AF37)`,
        boxShadow: glow,
        display: "inline-block",
        overflow: "hidden",
        flexShrink: 0,
        aspectRatio: "1 / 1",
        background: "#0a0a0a",
        verticalAlign: "middle",
      }}
    >
      <img
        src={GRADE_IMAGE[grade]}
        alt={grade}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
          transform: "scale(1.02)",
        }}
      />
    </span>
  );
}

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
