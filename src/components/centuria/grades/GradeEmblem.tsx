import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GRADE_LABELS, type Grade } from "@/lib/grades";

export type GradeEmblemState = "unlocked" | "current" | "locked";

const METALS: Record<Grade, { dark: string; mid: string; light: string; accent: string }> = {
  recruit: { dark: "#242729", mid: "#666b6d", light: "#a6abad", accent: "#565b5d" },
  soldat: { dark: "#303437", mid: "#8d9599", light: "#d1d5d6", accent: "#737b7f" },
  guerrier: { dark: "#39271d", mid: "#906044", light: "#c49269", accent: "#76503a" },
  spartiate: { dark: "#25282a", mid: "#858a8a", light: "#c49a63", accent: "#8e6842" },
  gladiateur: { dark: "#37291f", mid: "#aa7750", light: "#dab080", accent: "#8e5f40" },
  centurion: { dark: "#352d1d", mid: "#aa8b49", light: "#e0c77f", accent: "#8e743e" },
  titan: { dark: "#101214", mid: "#444b50", light: "#b6c0c4", accent: "#747f84" },
  legende: { dark: "#171512", mid: "#806a36", light: "#d3b867", accent: "#a88b45" },
  divin: { dark: "#252729", mid: "#bcc0bb", light: "#f1eee1", accent: "#d4c786" },
};

function Mark({ grade, fillId, accent }: { grade: Grade; fillId: string; accent: string }) {
  const common = { fill: `url(#${fillId})`, stroke: accent, strokeWidth: 1.5, strokeLinejoin: "round" as const };
  switch (grade) {
    case "recruit":
      return <path {...common} d="M32 17 47 25 32 45 17 25Zm0 8-7 4 7 9 7-9Z" />;
    case "soldat":
      return <><path {...common} d="m17 19 15 10 15-10-4 10-11 8-11-8Z" /><path {...common} d="m20 33 12 8 12-8-3 9-9 6-9-6Z" /></>;
    case "guerrier":
      return <><path {...common} d="m32 13 7 12-5 24h-4l-5-24Z" /><path d="M20 31h24" stroke={accent} strokeWidth="3" /><path d="m26 49 6 5 6-5" fill="none" stroke={accent} strokeWidth="2" /></>;
    case "spartiate":
      return <><path {...common} d="M32 12 49 20v15c0 9-7 15-17 19-10-4-17-10-17-19V20Z" /><path d="m32 20 9 8-4 14-5 5-5-5-4-14Z" fill="none" stroke={accent} strokeWidth="2" /></>;
    case "gladiateur":
      return <><path {...common} d="M19 43c1-19 6-29 18-29 8 0 12 5 12 12-7-2-14 0-18 5v16Z" /><path d="M17 47h30M32 31v16M38 22h11" fill="none" stroke={accent} strokeWidth="2" /></>;
    case "centurion":
      return <><path {...common} d="M12 34c8-1 13-6 20-18 7 12 12 17 20 18-8 3-12 8-14 16l-6-9-6 9c-2-8-6-13-14-16Z" /><path d="M23 29c5 0 7-3 9-8 2 5 4 8 9 8l-9 7Z" fill={accent} /></>;
    case "titan":
      return <><path {...common} d="m22 13 20 2 7 14-6 22-22-1-6-20Z" /><path d="m36 17-7 13 6 4-7 15" fill="none" stroke={accent} strokeWidth="1.4" /></>;
    case "legende":
      return <><path {...common} d="m15 43 3-25 10 12 4-17 5 17 10-12 2 25Z" /><path d="M19 47h27" stroke={accent} strokeWidth="3" /><path d="M13 38c-5-8-4-15 1-21M51 38c5-8 4-15-1-21" fill="none" stroke={accent} strokeWidth="2" /></>;
    case "divin":
      return <><path {...common} d="m32 14 8 10 12 8-12 8-8 10-8-10-12-8 12-8Z" /><circle cx="32" cy="32" r="8" fill="none" stroke={accent} strokeWidth="2" /><path d="M32 7v5m0 40v5M7 32h5m40 0h5M14 14l4 4m28 28 4 4m0-36-4 4M18 46l-4 4" stroke={accent} strokeWidth="2" /></>;
  }
}

export function GradeEmblem({
  grade,
  size = 48,
  state = "unlocked",
  progress,
  animated = false,
  className = "",
}: {
  grade: Grade;
  size?: number;
  state?: GradeEmblemState;
  progress?: number;
  animated?: boolean;
  className?: string;
}) {
  const rawId = useId().replace(/:/g, "");
  const fillId = `grade-metal-${rawId}`;
  const clipId = `grade-clip-${rawId}`;
  const metal = METALS[grade];
  const reduceMotion = useReducedMotion();
  const locked = state === "locked";
  const tier = ["recruit", "soldat", "guerrier", "spartiate", "gladiateur", "centurion", "titan", "legende", "divin"].indexOf(grade);
  const ringCount = tier >= 7 ? 2 : 1;
  const p = Math.max(0, Math.min(100, progress ?? (state === "current" ? 100 : 0)));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Grade ${GRADE_LABELS[grade]}${locked ? ", verrouillé" : state === "current" ? ", actuel" : ", débloqué"}`}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={fillId} x1="12" y1="10" x2="51" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor={locked ? "#343638" : metal.light} />
            <stop offset="0.45" stopColor={locked ? "#222426" : metal.mid} />
            <stop offset="1" stopColor={locked ? "#141617" : metal.dark} />
          </linearGradient>
          <clipPath id={clipId}><circle cx="32" cy="32" r="25" /></clipPath>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#0c0d0e" stroke={locked ? "#303335" : metal.dark} strokeWidth={tier >= 6 ? 2.2 : 1.5} />
        {ringCount === 2 && <circle cx="32" cy="32" r="25.8" fill="none" stroke={locked ? "#27292a" : metal.accent} strokeWidth="0.8" opacity="0.7" />}
        <g opacity={locked ? 0.38 : 1}><Mark grade={grade} fillId={fillId} accent={locked ? "#505355" : metal.accent} /></g>
        {locked && <path d="M23 34v-4a9 9 0 0 1 18 0v4m-20 0h22v16H21Z" fill="#111315" stroke="#55595b" strokeWidth="1.5" />}
        {animated && !locked && !reduceMotion && (
          <motion.rect
            x="-20" y="4" width="12" height="56" fill="#ffffff" opacity="0.16"
            transform="rotate(18 0 0)" clipPath={`url(#${clipId})`}
            initial={{ x: -20 }} animate={{ x: 90 }} transition={{ delay: 0.75, duration: 0.65, ease: "easeInOut" }}
          />
        )}
        {progress !== undefined && (
          <circle cx="32" cy="32" r="30.5" fill="none" stroke={metal.accent} strokeWidth="1.5" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - p} strokeLinecap="round" transform="rotate(-90 32 32)" />
        )}
      </svg>
      <span className="sr-only">{GRADE_LABELS[grade]}</span>
    </span>
  );
}