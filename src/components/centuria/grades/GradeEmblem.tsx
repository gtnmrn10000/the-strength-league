import { useId, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { GRADE_LABELS, GRADES, type Grade } from "@/lib/grades";

export type GradeEmblemState = "unlocked" | "current" | "locked";
export type GradeEmblemContext = "static" | "compact" | "gallery" | "level-up";

type Metal = { shadow: string; low: string; mid: string; high: string; edge: string; accent: string };

const METALS: Record<Grade, Metal> = {
  recruit: { shadow: "#090b0c", low: "#1b2023", mid: "#454c50", high: "#858c8e", edge: "#292f32", accent: "#a0a5a6" },
  soldat: { shadow: "#0b0d0e", low: "#242a2d", mid: "#626b70", high: "#b3babc", edge: "#775d36", accent: "#c9cccb" },
  guerrier: { shadow: "#100d0a", low: "#2e2119", mid: "#765033", high: "#b98958", edge: "#7e6039", accent: "#c9a16b" },
  spartiate: { shadow: "#0c0d0d", low: "#2a2119", mid: "#765433", high: "#b8874c", edge: "#96713f", accent: "#c49a60" },
  gladiateur: { shadow: "#100c08", low: "#302116", mid: "#91623a", high: "#d19a5a", edge: "#a87943", accent: "#e2bb77" },
  centurion: { shadow: "#0f0c07", low: "#302613", mid: "#8d6c2d", high: "#d0ac54", edge: "#a9853d", accent: "#e4ca78" },
  titan: { shadow: "#07090a", low: "#111619", mid: "#343d42", high: "#79878d", edge: "#536169", accent: "#d6dcde" },
  legende: { shadow: "#0d0a05", low: "#2a210e", mid: "#806322", high: "#c7a544", edge: "#a3812c", accent: "#e0c76d" },
  divin: { shadow: "#111416", low: "#3d4447", mid: "#9aa3a5", high: "#f1f2ed", edge: "#d2cda9", accent: "#fffcec" },
};

const LAUREL_LEFT = "M26 59C15 54 10 44 11 31m3 17 8 2m-10-9 8 3m-8-11 8 4m-5-12 7 5";
const LAUREL_RIGHT = "M46 59c11-5 16-15 15-28m-3 17-8 2m10-9-8 3m8-11-8 4m5-12-7 5";

function Laurel({ metal, animated, delay = 0 }: { metal: Metal; animated: boolean; delay?: number }) {
  const reveal = animated ? { pathLength: 1, opacity: 1 } : undefined;
  const initial = animated ? { pathLength: 0, opacity: .18 } : undefined;
  return <g fill="none" stroke={metal.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <motion.path d={LAUREL_LEFT} initial={initial} animate={reveal} transition={{ delay, duration: .58, ease: "easeOut" }} />
    <motion.path d={LAUREL_RIGHT} initial={initial} animate={reveal} transition={{ delay: delay + .08, duration: .58, ease: "easeOut" }} />
  </g>;
}

function Facet({ d, fill, opacity = 1 }: { d: string; fill: string; opacity?: number }) {
  return <path d={d} fill={fill} opacity={opacity} />;
}

/** Halo / aura premium, intensité croissante par rang. Purement décoratif, derrière l'insigne. */
const AURA_STRENGTH: Record<Grade, number> = {
  recruit: 0, soldat: .1, guerrier: .16, spartiate: .3, gladiateur: .42,
  centurion: .55, titan: .5, legende: .68, divin: .8,
};

function Aura({ grade, metal, auraId, context, animated, compact }: { grade: Grade; metal: Metal; auraId: string; context: GradeEmblemContext; animated: boolean; compact: boolean }) {
  const base = AURA_STRENGTH[grade];
  if (base === 0) return null;
  const ceremony = context === "level-up";
  const scale = ceremony ? 1 : context === "gallery" ? .62 : compact ? .3 : .48;
  const o = base * scale;
  const delay = ceremony ? .82 : .18;
  const ember = grade === "spartiate" || grade === "gladiateur" || grade === "centurion";

  return <g aria-hidden="true">
    <motion.circle
      cx="36" cy="37" r="33" fill={`url(#${auraId})`}
      initial={animated ? { opacity: 0, scale: .92 } : { opacity: o }}
      animate={animated ? { opacity: [0, o * 1.5, o], scale: 1 } : { opacity: o }}
      transition={{ delay, duration: .9, ease: "easeOut" }}
      style={{ transformOrigin: "36px 37px" }}
    />
    {ember && !compact && [0, 1, 2].map((i) => (
      <motion.circle key={i} cx={22 + i * 14} cy={58 - i * 3} r={.9 - i * .12} fill={metal.accent}
        initial={{ opacity: 0 }}
        animate={animated ? { opacity: [0, .5, 0], cy: [58 - i * 3, 44 - i * 3] } : { opacity: 0 }}
        transition={{ delay: delay + i * .14, duration: 1.1, ease: "easeOut" }} />
    ))}
    {grade === "legende" && !compact && [0, 1, 2, 3].map((i) => (
      <motion.circle key={i} cx={20 + i * 11} cy={20 + (i % 2) * 30} r=".85" fill={metal.accent}
        initial={{ opacity: 0 }}
        animate={animated ? { opacity: [0, .55, 0] } : { opacity: 0 }}
        transition={{ delay: delay + i * .12, duration: 1.2, ease: "easeInOut" }} />
    ))}
    {grade === "titan" && (
      <motion.circle cx="36" cy="37" r="30" fill="none" stroke={metal.accent} strokeWidth=".7"
        initial={{ opacity: 0 }}
        animate={animated ? { opacity: [0, .35, 0], scale: [.97, 1.02, 1] } : { opacity: 0 }}
        transition={{ delay: delay + .3, duration: .5 }} style={{ transformOrigin: "36px 37px" }} />
    )}
    {grade === "divin" && !compact && (
      <motion.g
        initial={{ opacity: 0 }} animate={animated ? { opacity: .5, rotate: ceremony ? 8 : 4 } : { opacity: .22 }}
        transition={{ delay: delay + .1, duration: ceremony ? 2.2 : 1.4, ease: "linear" }}
        style={{ transformOrigin: "36px 37px" }}>
        <circle cx="36" cy="37" r="32" fill="none" stroke={metal.accent} strokeWidth=".6" strokeDasharray="5 9" opacity=".7" />
      </motion.g>
    )}
  </g>;
}

function Insignia({ grade, fill, shade, metal, animated, context, compact }: { grade: Grade; fill: string; shade: string; metal: Metal; animated: boolean; context: GradeEmblemContext; compact: boolean }) {
  const ceremony = context === "level-up";
  const delay = ceremony ? .76 : .08;
  const draw = animated ? { pathLength: 1, opacity: 1 } : undefined;
  const initialDraw = animated ? { pathLength: 0, opacity: .16 } : undefined;
  const body = { fill: `url(#${fill})`, stroke: metal.edge, strokeWidth: 1.15, strokeLinejoin: "round" as const };
  const dark = `url(#${shade})`;

  switch (grade) {
    case "recruit":
      return <g filter="url(#relief)">
        <path {...body} d="m15 23 21 17 21-17-5 14-16 14-16-14Z" />
        <Facet d="m15 23 21 17v11L20 37Z" fill={metal.mid} /><Facet d="m57 23-21 17v11l16-14Z" fill={metal.low} />
        <path {...body} d="m20 40 16 13 16-13-4 12-12 11-12-11Z" />
        <path d="m20 40 16 13 16-13" fill="none" stroke={metal.accent} strokeWidth=".65" opacity=".65" />
      </g>;
    case "soldat":
      return <g filter="url(#relief)">
        <path {...body} d="M19 10h34l5 8-4 37-18 10-18-10-4-37Z" />
        <Facet d="M19 10h17v55L18 55l-4-37Z" fill={metal.mid} opacity={.42} />
        {[25, 36, 47].map((y, i) => <g key={y}><path d={`m22 ${y} 14 9 14-9-3 8-11 8-11-8Z`} fill={i === 1 ? metal.high : metal.mid} stroke={metal.edge} strokeWidth="1" /><path d={`m23 ${y} 13 7 13-7`} fill="none" stroke={metal.accent} strokeWidth=".7" /></g>)}
        <path d="M36 14v43" stroke={metal.high} strokeWidth=".55" opacity=".45" />
      </g>;
    case "guerrier":
      return <g filter="url(#relief)">
        <Laurel metal={metal} animated={false} />
        <path d="m36 7 5 7-2.6 33L36 56l-2.4-9L31 14Z" fill={`url(#${fill})`} stroke={metal.accent} strokeWidth="1" />
        <Facet d="m36 10 2.4 5L36 47l-2.3-32Z" fill={metal.high} opacity={.8} />
        <path d="M23 45h26l-4 5H27Z" fill={metal.mid} stroke={metal.edge} strokeWidth="1" />
        <path d="m33 55 3 9 3-9-3-4Z" fill={metal.high} stroke={metal.edge} strokeWidth="1" />
        {!compact && <><path d="M36 16v28" stroke={metal.accent} strokeWidth=".55" opacity=".65" /><circle cx="36" cy="48" r="2" fill={metal.shadow} stroke={metal.accent} strokeWidth=".7" /></>}
      </g>;
    case "spartiate":
      return <motion.g filter="url(#relief)" animate={animated ? { scale: [1, 1.012, 1] } : undefined} transition={{ delay, duration: .7 }} style={{ transformOrigin: "36px 36px" }}>
        <circle cx="36" cy="36" r="30" fill={dark} stroke={metal.edge} strokeWidth="2.8" />
        <circle cx="36" cy="36" r="25.5" fill="none" stroke={metal.mid} strokeWidth="1.1" />
        {!compact && [0, 90, 180, 270].map((a) => { const r = a * Math.PI / 180; return <circle key={a} cx={36 + Math.cos(r) * 27.8} cy={36 + Math.sin(r) * 27.8} r="1.15" fill={metal.accent} />; })}
        <motion.path d="M25 17c4-8 16-10 23-4l-4 5c-6-3-12-2-16 3Z" fill="#522a20" stroke={metal.edge} strokeWidth="1" initial={animated ? { scaleY: .9, opacity: .5 } : undefined} animate={animated ? { scaleY: 1, opacity: 1 } : undefined} transition={{ delay: delay + .2, duration: .42 }} style={{ transformOrigin: "36px 20px" }} />
        <path d="M24 27c1-8 7-13 16-12 8 1 13 7 13 15l-7-2-2 23-8 8-8-8-2-17-7-3Z" fill={`url(#${fill})`} stroke={metal.accent} strokeWidth="1.4" />
        <Facet d="m36 18 8 5-3 26-5 7Z" fill={metal.high} opacity={.7} /><Facet d="m28 26 8-8v38l-7-7Z" fill={metal.low} opacity={.72} />
        <path d="M27 33h18l-4 6H30Z" fill={metal.shadow} /><path d="M36 39v17" stroke={metal.edge} strokeWidth="1" />
      </motion.g>;
    case "gladiateur":
      return <g filter="url(#relief)">
        <circle cx="36" cy="36" r="30.5" fill={dark} stroke={metal.edge} strokeWidth="2" />
        <Laurel metal={metal} animated={animated} delay={delay} />
        <motion.g initial={animated ? { rotate: -.7, scale: .975 } : undefined} animate={animated ? { rotate: 0, scale: 1 } : undefined} transition={{ delay: delay + .1, duration: .52 }} style={{ transformOrigin: "36px 36px" }}>
          <path d="M25 52V31c0-11 7-18 17-18 8 0 14 5 15 13H43l-8 8v18Z" fill={`url(#${fill})`} stroke={metal.accent} strokeWidth="1.35" />
          <Facet d="M35 19c7-4 14 0 17 5H42l-7 8Z" fill={metal.high} opacity={.7} />
          <path d="M35 17v35M44 27l10 4M25 43h10M21 52h38" fill="none" stroke={metal.edge} strokeWidth="1.4" />
          <path d="M28 16c4-7 13-10 21-6l-3 5c-6-2-12-1-18 5Z" fill={metal.accent} stroke={metal.edge} strokeWidth="1" />
        </motion.g>
      </g>;
    case "centurion":
      return <g filter="url(#relief)">
        <motion.circle cx="36" cy="36" r="29.5" fill={dark} stroke={metal.edge} strokeWidth="1.5" initial={initialDraw} animate={draw} transition={{ delay, duration: .65 }} />
        <Laurel metal={metal} animated={animated} delay={delay + .06} />
        <motion.g initial={animated ? { scaleX: .86, opacity: .35 } : undefined} animate={animated ? { scaleX: [ .86, 1.035, 1 ], opacity: 1 } : undefined} transition={{ delay, duration: .66, ease: "easeOut" }} style={{ transformOrigin: "36px 34px" }}>
          <path d="M6 29c11 1 19-3 28-13l2 15 2-15c9 10 17 14 28 13-6 4-10 9-13 16l-13-7-4 16-4-16-13 7c-3-7-7-12-13-16Z" fill={`url(#${fill})`} stroke={metal.accent} strokeWidth="1.2" />
          <path d="M8 29c8 0 16-4 24-11l-1 7c-7 5-13 8-20 8Zm53 0c-8 0-16-4-24-11l1 7c7 5 13 8 20 8ZM13 36c6-1 11-3 17-7l-1 6c-5 4-9 6-13 6Zm46 0c-6-1-11-3-17-7l1 6c5 4 9 6 13 6Z" fill={metal.high} stroke={metal.edge} strokeWidth=".65" />
          <path d="m36 20 6 7-2 9-4 5-4-5-2-9Z" fill={metal.high} stroke={metal.edge} strokeWidth=".9" />
          <path d="m39 25 8 2-7 3Z" fill={metal.accent} stroke={metal.edge} strokeWidth=".65" />
          <circle cx="37.5" cy="25.8" r=".8" fill={metal.shadow} />
          <path d="m31 47 5 8 5-8M27 50l9 7 9-7" fill="none" stroke={metal.accent} strokeWidth="1.15" />
        </motion.g>
        <path d="m30 10 2-6 4 4 4-4 2 6-3 4h-6Z" fill={metal.accent} stroke={metal.edge} strokeWidth=".8" />
      </g>;
    case "titan":
      return <g filter="url(#relief)">
        <path d="m36 5 18 9 8 18-7 26-19 9-19-9-7-26 8-18Z" fill={dark} stroke={metal.edge} strokeWidth="2" />
        <path d="m22 16 14-7 14 7 6 16-7 22-13 8-13-8-7-22Z" fill={`url(#${fill})`} stroke={metal.mid} strokeWidth="1.2" />
        <Facet d="m22 16 14-7v53l-13-8-7-22Z" fill={metal.low} opacity={.85} /><Facet d="m50 16-14-7v53l13-8 7-22Z" fill={metal.mid} opacity={.7} />
        <path d="m20 28 12-7 4 9 4-9 12 7-5 9-7-3v19l-4 8-4-8V34l-7 3Z" fill={metal.shadow} stroke={metal.edge} strokeWidth="1.1" />
        <path d="m24 38 8 3m16-3-8 3" stroke={metal.accent} strokeWidth="1.2" />
        <motion.path d="m41 13-8 15 6 7-8 18" fill="none" stroke={metal.accent} strokeWidth="1.15" animate={animated ? { opacity: [.18, 1, .3] } : undefined} transition={{ delay: ceremony ? 1.12 : .34, duration: .16, times: [0, .5, 1] }} />
      </g>;
    case "legende":
      return <g filter="url(#relief)">
        <circle cx="36" cy="37" r="29" fill={dark} stroke={metal.edge} strokeWidth="1.6" />
        <Laurel metal={metal} animated={animated} delay={delay} />
        <motion.g initial={animated ? { opacity: .3, y: 1 } : undefined} animate={animated ? { opacity: 1, y: 0 } : undefined} transition={{ delay: delay + .16, duration: .52 }}>
          <path d="m24 25 5-8 7 4 7-4 5 8-3 21-9 12-9-12Z" fill={`url(#${fill})`} stroke={metal.accent} strokeWidth="1.15" />
          <Facet d="m24 25 12-4v37l-9-12Z" fill={metal.mid} opacity={.58} /><Facet d="m48 25-12-4v37l9-12Z" fill={metal.low} opacity={.68} />
          <path d="m27 31 6 3 3-5 3 5 6-3-3 8 4 6-6 1-4 9-4-9-6-1 4-6Z" fill={metal.shadow} stroke={metal.edge} strokeWidth=".8" />
          <path d="M31 40h10M33 46l3 3 3-3" fill="none" stroke={metal.accent} strokeWidth="1" />
        </motion.g>
        <motion.path d="m27 14 3-8 6 5 6-5 3 8-3 5H30Z" fill={metal.accent} stroke={metal.edge} strokeWidth="1" initial={animated ? { opacity: 0, y: 3 } : undefined} animate={animated ? { opacity: 1, y: 0 } : undefined} transition={{ delay: delay + .38, duration: .35 }} />
      </g>;
    case "divin":
      return <g filter="url(#relief)">
        <motion.circle cx="36" cy="37" r="29" fill={dark} stroke={metal.edge} strokeWidth="1" strokeDasharray="9 4" initial={initialDraw} animate={draw} transition={{ delay, duration: .75 }} />
        <motion.g initial={animated ? { scaleX: .82, opacity: .25 } : undefined} animate={animated ? { scaleX: 1, opacity: 1 } : undefined} transition={{ delay: delay + .16, duration: .6, ease: "easeOut" }} style={{ transformOrigin: "36px 38px" }}>
          <path d="M5 37c9-1 16-6 25-17l6 14 6-14c9 11 16 16 25 17-7 3-14 8-19 16l-12-9-12 9C19 45 12 40 5 37Z" fill={`url(#${fill})`} stroke={metal.accent} strokeWidth="1" />
          <Facet d="M7 37c9-2 16-7 23-17l6 14v10l-12 9C19 45 13 40 7 37Z" fill={metal.mid} opacity={.48} />
        </motion.g>
        <path d="m36 5 4 9-2 37-2 12-2-12-2-37Z" fill={metal.high} stroke={metal.edge} strokeWidth="1" />
        <path d="M36 9v44" stroke={metal.accent} strokeWidth=".65" />
        <motion.ellipse cx="36" cy="7" rx="7" ry="2.1" fill="none" stroke={metal.edge} strokeWidth="1.2" initial={animated ? { opacity: 0, scaleX: .7 } : undefined} animate={animated ? { opacity: 1, scaleX: 1 } : undefined} transition={{ delay: delay + .46, duration: .32 }} style={{ transformOrigin: "36px 7px" }} />
        {!compact && [0, 1, 2, 3].map((i) => <motion.path key={i} d={`M${36 + (i % 2 ? 24 : -24)} ${i < 2 ? 20 : 54}h${i % 2 ? 7 : -7}`} stroke={metal.accent} strokeWidth="1.7" strokeLinecap="round" initial={animated ? { opacity: 0, pathLength: 0 } : undefined} animate={animated ? { opacity: 1, pathLength: 1 } : undefined} transition={{ delay: delay + i * .08, duration: .2 }} />)}
      </g>;
  }
}

export function GradeEmblem({ grade, size = 48, state, locked = false, active = false, progress, animated = false, context = "static", className = "" }: {
  grade: Grade; size?: number; state?: GradeEmblemState; locked?: boolean; active?: boolean; progress?: number; animated?: boolean; context?: GradeEmblemContext; className?: string;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId().replace(/:/g, "");
  const fill = `grade-metal-${id}`;
  const shade = `grade-shade-${id}`;
  const sweep = `grade-sweep-${id}`;
  const texture = `grade-texture-${id}`;
  const relief = `grade-relief-${id}`;
  const reduceMotion = Boolean(useReducedMotion());
  const resolvedLocked = locked || state === "locked";
  const resolvedActive = active || state === "current";
  const metal = METALS[grade];
  const tier = GRADES.indexOf(grade);
  const inView = useInView(rootRef, { once: true, amount: .45 });
  const canAnimate = animated && tier >= 3 && !resolvedLocked && !reduceMotion && inView;
  const animateInsignia = canAnimate && context !== "compact";
  const allowSweep = canAnimate && (["spartiate", "gladiateur", "centurion", "legende", "divin"] as Grade[]).includes(grade);
  const compact = size <= 36 || context === "compact";
  const p = Math.max(0, Math.min(100, progress ?? (resolvedActive ? 100 : 0)));

  return <motion.span ref={rootRef} className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }} role="img" aria-label={`Grade ${GRADE_LABELS[grade]}${resolvedLocked ? ", verrouillé" : resolvedActive ? ", actuel" : ", débloqué"}`} whileTap={!reduceMotion && grade === "gladiateur" && !resolvedLocked ? { scale: .985, rotate: -.35 } : undefined}>
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={fill} x1="13" y1="8" x2="59" y2="65" gradientUnits="userSpaceOnUse"><stop stopColor={resolvedLocked ? "#3d4143" : metal.high} /><stop offset=".22" stopColor={resolvedLocked ? "#2c3032" : metal.mid} /><stop offset=".5" stopColor={resolvedLocked ? "#181b1d" : metal.low} /><stop offset=".72" stopColor={resolvedLocked ? "#313537" : metal.mid} /><stop offset="1" stopColor={resolvedLocked ? "#101214" : metal.shadow} /></linearGradient>
        <radialGradient id={shade} cx="38%" cy="28%" r="70%"><stop stopColor={resolvedLocked ? "#303436" : metal.mid} stopOpacity=".72" /><stop offset=".55" stopColor={resolvedLocked ? "#151719" : metal.low} /><stop offset="1" stopColor={metal.shadow} /></radialGradient>
        <linearGradient id={sweep}><stop stopColor={metal.accent} stopOpacity="0" /><stop offset=".48" stopColor={metal.accent} stopOpacity=".08" /><stop offset=".52" stopColor={metal.accent} stopOpacity=".7" /><stop offset="1" stopColor={metal.accent} stopOpacity="0" /></linearGradient>
        <pattern id={texture} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><path d="M0 1h8M0 5h8" stroke={metal.accent} strokeWidth=".22" opacity=".14" /></pattern>
        <filter id={relief} x="-18%" y="-18%" width="136%" height="136%"><feDropShadow dx="0" dy="1.2" stdDeviation=".8" floodColor={metal.shadow} floodOpacity=".9" /><feDropShadow dx="0" dy="-.35" stdDeviation=".25" floodColor={metal.accent} floodOpacity=".28" /></filter>
        <clipPath id={`grade-clip-${id}`}><circle cx="36" cy="36" r="34" /></clipPath>
      </defs>
      <g opacity={resolvedLocked ? .22 : 1} style={{ filter: `url(#${relief})` }}>
        <Insignia grade={grade} fill={fill} shade={shade} metal={resolvedLocked ? { ...metal, edge: "#454a4c", accent: "#5b6062" } : metal} animated={animateInsignia} context={context} compact={compact} />
        {!compact && <path d="M9 28h54M12 43h48" stroke={`url(#${texture})`} strokeWidth="5" opacity=".16" />}
      </g>
      {allowSweep && <motion.rect x="-30" y="0" width={grade === "divin" ? 7 : 11} height="72" fill={`url(#${sweep})`} transform="skewX(-16)" clipPath={`url(#grade-clip-${id})`} initial={{ x: -30, opacity: 0 }} animate={{ x: 110, opacity: [0, 1, 0] }} transition={{ delay: context === "level-up" ? 1.04 : .4, duration: .5, ease: "easeInOut" }} />}
      {resolvedLocked && <g><path d="M30 37v-3a6 6 0 0 1 12 0v3" fill="none" stroke="#666a6c" strokeWidth="1.4" /><path d="M28 37h16v12H28Z" fill="#101214" stroke="#555a5c" strokeWidth="1" /></g>}
      {progress !== undefined && <circle cx="36" cy="36" r="34.6" fill="none" stroke={metal.accent} strokeWidth="1.1" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - p} strokeLinecap="round" transform="rotate(-90 36 36)" />}
    </svg>
    <span className="sr-only">{GRADE_LABELS[grade]}</span>
  </motion.span>;
}