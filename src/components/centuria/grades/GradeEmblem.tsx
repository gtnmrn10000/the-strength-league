import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GRADE_LABELS, GRADES, type Grade } from "@/lib/grades";

export type GradeEmblemState = "unlocked" | "current" | "locked";

type Metal = { low: string; mid: string; high: string; edge: string; detail: string };

const METALS: Record<Grade, Metal> = {
  recruit: { low: "#1b1e20", mid: "#454a4d", high: "#777d80", edge: "#4a4f52", detail: "#8a9092" },
  soldat: { low: "#252a2d", mid: "#687075", high: "#b5bdc1", edge: "#737c81", detail: "#c5cbce" },
  guerrier: { low: "#281a14", mid: "#70442f", high: "#b8754e", edge: "#74452f", detail: "#c48259" },
  spartiate: { low: "#17191a", mid: "#66513b", high: "#b27a43", edge: "#88603a", detail: "#c89255" },
  gladiateur: { low: "#251a12", mid: "#895735", high: "#cf8d50", edge: "#9d693e", detail: "#d9a161" },
  centurion: { low: "#211b10", mid: "#79602d", high: "#c6a253", edge: "#a1813d", detail: "#dcc274" },
  titan: { low: "#101315", mid: "#343b3f", high: "#778389", edge: "#647278", detail: "#d2d9dc" },
  legende: { low: "#15120c", mid: "#65501e", high: "#b69236", edge: "#987829", detail: "#d1b65e" },
  divin: { low: "#25282a", mid: "#8d9699", high: "#e4e7e5", edge: "#c8c9bd", detail: "#f3f1df" },
};

function Insignia({ grade, fill, metal, animated, reduceMotion }: { grade: Grade; fill: string; metal: Metal; animated: boolean; reduceMotion: boolean }) {
  const shared = { fill: `url(#${fill})`, stroke: metal.edge, strokeWidth: 1.25, strokeLinejoin: "round" as const };
  const draw = animated && !reduceMotion ? { pathLength: [0, 1], opacity: [0.25, 1] } : undefined;
  const transition = { delay: 0.82, duration: 0.58, ease: "easeOut" as const };

  switch (grade) {
    case "recruit":
      return <><path {...shared} d="M24 13h24l7 10-4 32-15 8-15-8-4-32Z" /><path d="m26 34 10 9 10-9-3 9-7 7-7-7Z" fill={metal.detail} opacity=".82" /></>;
    case "soldat":
      return <><path {...shared} d="M20 14h32l6 11-5 29-17 9-17-9-5-29Z" /><path d="m24 28 12 9 12-9-3 8-9 7-9-7Zm2 14 10 7 10-7-3 7-7 5-7-5Z" fill={metal.detail} /><path d="M36 20v31" stroke={metal.edge} strokeWidth="1" opacity=".7" /></>;
    case "guerrier":
      return <><path {...shared} d="m36 9 20 13-3 31-17 11-17-11-3-31Z" /><path d="m23 24 5-3 10 26-4 2Zm26 0-5-3-10 26 4 2Z" fill={metal.detail} /><path d="M25 48h22M36 16v8" stroke={metal.edge} strokeWidth="2" /></>;
    case "spartiate":
      return <><path {...shared} strokeWidth="2" d="M36 7 58 18v19c0 14-8 23-22 29-14-6-22-15-22-29V18Z" /><path d="M36 17 49 29l-4 20-9 8-9-8-4-20Zm0 8-6 7 6-2 6 2Z" fill="#17191a" stroke={metal.detail} strokeWidth="1.6" /></>;
    case "gladiateur":
      return <><path {...shared} d="M14 58h44l-5-8V30C53 17 46 9 35 9 23 9 17 18 17 33v17Z" /><path d="M22 48V31c0-10 5-16 13-16 7 0 11 4 12 11H35l-8 8v14Z" fill="#171411" stroke={metal.detail} strokeWidth="1.5" /><path d="M35 15v33M47 26l7 4M17 50h36M28 10c4-4 11-5 16-2" fill="none" stroke={metal.detail} strokeWidth="2" /></>;
    case "centurion":
      return <><path {...shared} strokeWidth="1.6" d="M22 8h28l5 9-3 41-16 8-16-8-3-41Z" /><path d="M8 32c11-1 18-7 28-19 10 12 17 18 28 19-8 4-13 9-17 18l-11-9-11 9c-4-9-9-14-17-18Z" fill="#15130d" stroke={metal.detail} strokeWidth="1.7" /><path d="m18 30 12-4 6-8 6 8 12 4-12 4-6 6-6-6Z" fill={metal.detail} /><path d="M24 12h24M21 17h30" stroke={metal.edge} strokeWidth="1" /></>;
    case "titan":
      return <><path {...shared} strokeWidth="2" d="m18 11 36 2 10 18-8 30-39-2L8 30Z" /><path d="m25 18 23 1 6 14-6 21-24-1-6-21Z" fill="#14181a" stroke={metal.edge} strokeWidth="1.4" /><motion.path d="m41 18-10 16 8 6-10 14" fill="none" stroke={metal.detail} strokeWidth="1.35" animate={animated && !reduceMotion ? { opacity: [0.4, 1, 0.5] } : undefined} transition={{ delay: 1.18, duration: 0.3 }} /></>;
    case "legende":
      return <><path {...shared} d="M36 10 53 19l7 17-7 17-17 9-17-9-7-17 7-17Z" opacity=".7" /><motion.path d="M29 55C18 50 13 41 14 28c7 3 12 9 14 17M43 55c11-5 16-14 15-27-7 3-12 9-14 17M19 34l7 4m-9 3 10 3m26-10-7 4m9 3-10 3" fill="none" stroke={metal.detail} strokeWidth="2.2" strokeLinecap="round" animate={draw} transition={transition} /><path d="m36 22 7 14-7 9-7-9Z" fill={metal.detail} /><circle cx="36" cy="36" r="20" fill="none" stroke={metal.edge} strokeWidth=".8" /></>;
    case "divin":
      return <><path {...shared} d="m36 7 12 10 17 19-17 19-12 10-12-10L7 36l17-19Z" opacity=".72" /><path d="m36 15 9 21-9 21-9-21Z" fill={metal.detail} stroke={metal.edge} strokeWidth="1.2" /><circle cx="36" cy="36" r="10" fill="#272b2d" stroke={metal.detail} strokeWidth="1.3" />{[[36,10,36,17],[62,36,55,36],[36,62,36,55],[10,36,17,36]].map((line, i) => <motion.line key={i} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke={metal.detail} strokeWidth="2.4" strokeLinecap="round" initial={animated && !reduceMotion ? { opacity: 0 } : undefined} animate={{ opacity: 1 }} transition={{ delay: .86 + i * .1 }} />)}<circle cx="36" cy="36" r="26" fill="none" stroke={metal.edge} strokeWidth=".7" strokeDasharray="7 5" /></>;
  }
}

export function GradeEmblem({ grade, size = 48, state, locked = false, active = false, progress, animated = false, className = "" }: {
  grade: Grade; size?: number; state?: GradeEmblemState; locked?: boolean; active?: boolean; progress?: number; animated?: boolean; className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const fill = `grade-metal-${id}`;
  const sweep = `grade-sweep-${id}`;
  const reduceMotion = Boolean(useReducedMotion());
  const resolvedLocked = locked || state === "locked";
  const resolvedActive = active || state === "current";
  const metal = METALS[grade];
  const tier = GRADES.indexOf(grade);
  const p = Math.max(0, Math.min(100, progress ?? (resolvedActive ? 100 : 0)));
  const rings = tier >= 8 ? 3 : tier >= 5 ? 2 : 1;

  return <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }} role="img" aria-label={`Grade ${GRADE_LABELS[grade]}${resolvedLocked ? ", verrouillé" : resolvedActive ? ", actuel" : ", débloqué"}`}>
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={fill} x1="15" y1="9" x2="57" y2="63" gradientUnits="userSpaceOnUse"><stop stopColor={resolvedLocked ? "#383b3d" : metal.high} /><stop offset=".42" stopColor={resolvedLocked ? "#25282a" : metal.mid} /><stop offset="1" stopColor={resolvedLocked ? "#121416" : metal.low} /></linearGradient>
        <linearGradient id={sweep}><stop stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".2" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <clipPath id={`grade-clip-${id}`}><circle cx="36" cy="36" r="31" /></clipPath>
      </defs>
      {Array.from({ length: rings }).map((_, i) => <motion.circle key={i} cx="36" cy="36" r={34 - i * 2.6} fill={i === 0 ? "#090a0b" : "none"} stroke={resolvedLocked ? "#303335" : i === 0 ? metal.edge : metal.detail} strokeWidth={i === 0 ? 1.15 : .65} opacity={i === 0 ? 1 : .68} pathLength="1" initial={animated && !reduceMotion ? { pathLength: 0, opacity: 0 } : undefined} animate={{ pathLength: 1, opacity: i === 0 ? 1 : .68 }} transition={{ delay: .76 + i * .12, duration: .62, ease: "easeOut" }} />)}
      <g opacity={resolvedLocked ? .2 : 1}><Insignia grade={grade} fill={fill} metal={resolvedLocked ? { ...metal, edge: "#4a4e50", detail: "#55595b" } : metal} animated={animated} reduceMotion={reduceMotion} /></g>
      {animated && !resolvedLocked && !reduceMotion && <motion.rect x="-28" y="0" width="12" height="72" fill={`url(#${sweep})`} transform="skewX(-16)" clipPath={`url(#grade-clip-${id})`} initial={{ x: -28 }} animate={{ x: 108 }} transition={{ delay: 1.05, duration: .46, ease: "easeInOut" }} />}
      {resolvedLocked && <g><path d="M29 35v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#626669" strokeWidth="1.5" /><path d="M27 35h18v14H27Z" fill="#111315" stroke="#565a5d" strokeWidth="1.2" /></g>}
      {progress !== undefined && <circle cx="36" cy="36" r="34.6" fill="none" stroke={metal.detail} strokeWidth="1.2" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - p} strokeLinecap="round" transform="rotate(-90 36 36)" />}
    </svg>
    <span className="sr-only">{GRADE_LABELS[grade]}</span>
  </span>;
}