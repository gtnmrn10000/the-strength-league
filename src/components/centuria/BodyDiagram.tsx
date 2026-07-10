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

/** 0 = neutre, 1/2/3 = tiers d'intensité (mappés à frequency react-body-highlighter). */
function tierFor(intensity: number | undefined): 0 | 1 | 2 | 3 {
  if (!intensity) return 0;
  if (intensity >= 0.75) return 3;
  if (intensity >= 0.5) return 2;
  return 1;
}

export type MuscleIntensity = Partial<Record<Region, number>>;

// Palette or → rouge sang, indexée par frequency-1
// Dégradé or : or sombre → or franc → or clair (F0D875)
const HIGHLIGHT_COLORS = ["#8a6a1f", "#D4AF37", "#F0D875"];
const BODY_COLOR = "#1a1a1a";

function buildData(
  intensities: MuscleIntensity | undefined,
  map: Partial<Record<Region, Muscle[]>>,
): IExerciseData[] {
  const buckets: Record<number, Muscle[]> = { 1: [], 2: [], 3: [] };
  (Object.keys(map) as Region[]).forEach((r) => {
    const tier = tierFor(intensities?.[r]);
    if (tier === 0) return;
    buckets[tier].push(...(map[r] ?? []));
  });
  const data: IExerciseData[] = [];
  ([1, 2, 3] as const).forEach((freq) => {
    const muscles = Array.from(new Set(buckets[freq]));
    if (muscles.length === 0) return;
    // Répète l'exercice `freq` fois pour que frequency = freq
    for (let i = 0; i < freq; i++) {
      data.push({ name: `tier-${freq}-${i}`, muscles });
    }
  });
  return data;
}

/**
 * Silhouette anatomique premium via react-body-highlighter.
 * Muscles ciblés rendus en dégradé or → rouge sang selon l'intensité.
 */
export default function BodyDiagram({
  intensities,
  targets,
}: {
  intensities?: MuscleIntensity;
  targets?: string[];
}) {
  const frontData = buildData(intensities, FRONT_MAP);
  const backData = buildData(intensities, BACK_MAP);
  const targetSet = new Set((targets ?? []).map((t) => normalizeMuscle(t)));

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-arena-border p-4"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(212,175,55,0.08) 0%, rgba(10,10,10,0) 55%), linear-gradient(180deg, #0b0b0d 0%, #060606 100%)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black tracking-widest text-arena-muted">CIBLES DE LA SÉANCE</p>
        <div className="flex items-center gap-3">
          <LegendDot color={HIGHLIGHT_COLORS[1]} label="ciblé" />
          <LegendDot color={HIGHLIGHT_COLORS[2]} label="intense" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ModelSide view="anterior" data={frontData} />
        <ModelSide view="posterior" data={backData} />
      </div>

      {targets && targets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...targetSet].map((t) => {
            const int = intensities?.[t as Region];
            return (
              <span
                key={t}
                className="rounded-full border border-arena-gold/40 bg-arena-gold/10 px-2 py-0.5 text-[10px] font-bold text-arena-gold"
              >
                {LABEL[t as Region] ?? t}
                {int ? ` · ${Math.round(int * 100)}%` : ""}
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
      <span className="text-[10px] text-arena-sub">{label}</span>
    </div>
  );
}
