import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";
import { normalizeMuscle } from "@/lib/workoutTemplates";

type Region =
  | "pectoraux"
  | "epaules"
  | "biceps"
  | "avant_bras"
  | "abdos"
  | "quadriceps"
  | "mollets"
  | "dos"
  | "triceps"
  | "fessiers"
  | "ischios";

const LABEL: Record<Region, string> = {
  pectoraux: "Pecs",
  epaules: "Épaules",
  biceps: "Biceps",
  avant_bras: "Avant-bras",
  abdos: "Abdos",
  quadriceps: "Quadris",
  mollets: "Mollets",
  dos: "Dos",
  triceps: "Triceps",
  fessiers: "Fessiers",
  ischios: "Ischios",
};

const FRONT_MAP: Partial<Record<Region, Muscle[]>> = {
  pectoraux: ["chest"],
  epaules: ["front-deltoids"],
  biceps: ["biceps"],
  avant_bras: ["forearm"],
  abdos: ["abs", "obliques"],
  quadriceps: ["quadriceps"],
  mollets: ["calves"],
};

const BACK_MAP: Partial<Record<Region, Muscle[]>> = {
  dos: ["upper-back", "lower-back"],
  epaules: ["back-deltoids"],
  triceps: ["triceps"],
  avant_bras: ["forearm"],
  fessiers: ["gluteal"],
  ischios: ["hamstring"],
  mollets: ["calves"],
};

export type MuscleIntensity = Partial<Record<Region, number>>;
export type MuscleRecovery = Partial<Record<Region, number>>; // 0..100

// Traffic light : rouge <50, orange 50-80, vert >80
const COLOR_RED = "#ef4444";
const COLOR_ORANGE = "#f59e0b";
const COLOR_GREEN = "#22c55e";
const HIGHLIGHT_COLORS = [COLOR_RED, COLOR_ORANGE, COLOR_GREEN];
const BODY_COLOR = "#1a1a1a";

/** Retourne un tier 1=rouge, 2=orange, 3=vert (mappé sur frequency 1/2/3). */
function tierForRecovery(pct: number | undefined): 0 | 1 | 2 | 3 {
  if (pct === undefined) return 0;
  if (pct < 50) return 1; // rouge : pas récup
  if (pct <= 80) return 2; // orange : en cours
  return 3; // vert : frais (>80)
}

function buildData(
  recovery: MuscleRecovery | undefined,
  map: Partial<Record<Region, Muscle[]>>,
): IExerciseData[] {
  const buckets: Record<number, Muscle[]> = { 1: [], 2: [], 3: [] };
  (Object.keys(map) as Region[]).forEach((r) => {
    const tier = tierForRecovery(recovery?.[r]);
    if (tier === 0) return;
    buckets[tier].push(...(map[r] ?? []));
  });
  const data: IExerciseData[] = [];
  ([1, 2, 3] as const).forEach((freq) => {
    const muscles = Array.from(new Set(buckets[freq]));
    if (muscles.length === 0) return;
    for (let i = 0; i < freq; i++) {
      data.push({ name: `tier-${freq}-${i}`, muscles });
    }
  });
  return data;
}

/**
 * Silhouettes avant/arrière colorées par état de récup :
 * rouge <50 %, orange 50-80 %, vert >80 %.
 * Les muscles jamais travaillés restent gris (baseline).
 */
export default function BodyDiagram({
  recovery,
  targets,
}: {
  /** Legacy prop — ignoré, gardé pour compat. */
  intensities?: MuscleIntensity;
  recovery?: MuscleRecovery;
  targets?: string[];
}) {
  const frontData = buildData(recovery, FRONT_MAP);
  const backData = buildData(recovery, BACK_MAP);
  const targetSet = new Set((targets ?? []).map((t) => normalizeMuscle(t)));

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        border: "1px solid rgba(212,175,55,0.35)",
        boxShadow: "0 0 0 1px rgba(212,175,55,0.08) inset, 0 8px 30px rgba(0,0,0,0.4)",
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(212,175,55,0.10) 0%, rgba(10,10,10,0) 55%), linear-gradient(180deg, #0b0b0d 0%, #060606 100%)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black tracking-widest text-arena-muted">RÉCUPÉRATION</p>
        <div className="flex items-center gap-3">
          <LegendDot color={COLOR_RED} label="<50%" />
          <LegendDot color={COLOR_ORANGE} label="50-80%" />
          <LegendDot color={COLOR_GREEN} label=">80%" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ModelSide view="anterior" data={frontData} />
        <ModelSide view="posterior" data={backData} />
      </div>

      {targets && targets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...targetSet].map((t) => {
            const pct = recovery?.[t as Region];
            const color =
              pct === undefined
                ? "rgba(212,175,55,0.6)"
                : pct < 50
                  ? COLOR_RED
                  : pct <= 80
                    ? COLOR_ORANGE
                    : COLOR_GREEN;
            return (
              <span
                key={t}
                className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  borderColor: `${color}66`,
                  background: `${color}1a`,
                  color,
                }}
              >
                {LABEL[t as Region] ?? t}
                {pct !== undefined ? ` · ${Math.round(pct)}%` : ""}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModelSide({
  view,
  data,
}: {
  view: "anterior" | "posterior";
  data: IExerciseData[];
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-center">
        <Model
          type={view}
          data={data}
          bodyColor={BODY_COLOR}
          highlightedColors={HIGHLIGHT_COLORS}
          style={{ width: "100%", maxWidth: 140, padding: 0 }}
          svgStyle={{
            stroke: "rgba(212,175,55,0.25)",
            strokeWidth: 0.4,
          }}
        />
      </div>
      <p className="mt-1 text-[9px] font-black tracking-[0.2em] text-arena-muted">
        {view === "anterior" ? "AVANT" : "ARRIÈRE"}
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-[9px] text-arena-sub">{label}</span>
    </div>
  );
}
