import { normalizeMuscle } from "@/lib/workoutTemplates";

// Groupes affichables sur les silhouettes.
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

const FRONT_REGIONS: Region[] = [
  "pectoraux", "epaules", "biceps", "avant_bras", "abdos", "quadriceps", "mollets",
];
const BACK_REGIONS: Region[] = [
  "dos", "epaules", "triceps", "avant_bras", "fessiers", "ischios", "mollets",
];

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

/**
 * Intensity 0..1 par muscle. Retourne la couleur or (surbrillance) ou gris.
 */
function fillFor(intensity: number | undefined): string {
  if (!intensity) return "hsl(0 0% 18%)";
  // interp gris → or
  if (intensity >= 0.75) return "hsl(45 90% 55%)";
  if (intensity >= 0.5) return "hsl(45 80% 48%)";
  if (intensity >= 0.25) return "hsl(40 60% 38%)";
  return "hsl(35 40% 30%)";
}

export type MuscleIntensity = Partial<Record<Region, number>>;

/**
 * Silhouette front + back stylisée (formes géométriques simples).
 * Les régions ciblées se colorent en or selon l'intensité.
 */
export default function BodyDiagram({
  intensities,
  targets,
}: {
  intensities?: MuscleIntensity;
  /** Groupes ciblés par la séance du jour (pour la légende). */
  targets?: string[];
}) {
  const getInt = (r: Region) => intensities?.[r];
  const targetSet = new Set((targets ?? []).map((t) => normalizeMuscle(t)));

  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black tracking-widest text-arena-muted">CIBLES DE LA SÉANCE</p>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "hsl(45 90% 55%)" }} />
          <span className="text-[10px] text-arena-sub">travaillé</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Silhouette view="front" getInt={getInt} />
        <Silhouette view="back" getInt={getInt} />
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

function Silhouette({
  view,
  getInt,
}: {
  view: "front" | "back";
  getInt: (r: Region) => number | undefined;
}) {
  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 220" width="100%" className="max-h-64" preserveAspectRatio="xMidYMid meet">
        {/* Silhouette outline */}
        <g fill="hsl(0 0% 10%)" stroke="hsl(0 0% 22%)" strokeWidth="1">
          {/* Tête */}
          <ellipse cx="60" cy="18" rx="12" ry="14" />
          {/* Cou */}
          <rect x="55" y="30" width="10" height="8" />
          {/* Torse */}
          <path d="M35,40 Q30,55 32,80 L36,110 Q38,120 44,124 L76,124 Q82,120 84,110 L88,80 Q90,55 85,40 Q75,36 60,36 Q45,36 35,40 Z" />
          {/* Bras gauche */}
          <path d="M32,45 Q20,60 22,90 L24,120 Q22,140 25,155 L32,156 Q34,140 32,120 L33,90 Q34,70 40,55 Z" />
          {/* Bras droit */}
          <path d="M88,45 Q100,60 98,90 L96,120 Q98,140 95,155 L88,156 Q86,140 88,120 L87,90 Q86,70 80,55 Z" />
          {/* Bassin */}
          <path d="M40,124 L42,148 Q48,152 60,152 Q72,152 78,148 L80,124 Z" />
          {/* Jambe gauche */}
          <path d="M42,148 Q40,170 42,195 L46,215 L56,215 L57,195 Q58,170 58,148 Z" />
          {/* Jambe droite */}
          <path d="M78,148 Q80,170 78,195 L74,215 L64,215 L63,195 Q62,170 62,148 Z" />
        </g>

        {/* Overlays muscle par muscle */}
        {regions.map((r) => (
          <MuscleShape key={r} view={view} region={r} fill={fillFor(getInt(r))} />
        ))}

        {/* Contours */}
      </svg>
      <p className="mt-1 text-[9px] font-bold tracking-widest text-arena-muted">
        {view === "front" ? "AVANT" : "ARRIÈRE"}
      </p>
    </div>
  );
}

function MuscleShape({
  view,
  region,
  fill,
}: {
  view: "front" | "back";
  region: Region;
  fill: string;
}) {
  const common = { fill, opacity: 0.92 } as const;
  if (view === "front") {
    switch (region) {
      case "pectoraux":
        return (
          <g {...common}>
            <path d="M42,44 Q52,42 59,44 L59,60 Q52,64 43,62 Q40,54 42,44 Z" />
            <path d="M78,44 Q68,42 61,44 L61,60 Q68,64 77,62 Q80,54 78,44 Z" />
          </g>
        );
      case "epaules":
        return (
          <g {...common}>
            <path d="M32,42 Q28,50 34,58 Q40,50 40,44 Z" />
            <path d="M88,42 Q92,50 86,58 Q80,50 80,44 Z" />
          </g>
        );
      case "biceps":
        return (
          <g {...common}>
            <path d="M26,64 Q22,80 26,94 L32,92 Q32,78 32,66 Z" />
            <path d="M94,64 Q98,80 94,94 L88,92 Q88,78 88,66 Z" />
          </g>
        );
      case "avant_bras":
        return (
          <g {...common}>
            <path d="M26,100 Q24,120 28,138 L34,136 Q32,118 32,100 Z" />
            <path d="M94,100 Q96,120 92,138 L86,136 Q88,118 88,100 Z" />
          </g>
        );
      case "abdos":
        return (
          <g {...common}>
            <rect x="52" y="70" width="16" height="10" rx="2" />
            <rect x="52" y="82" width="16" height="10" rx="2" />
            <rect x="52" y="94" width="16" height="10" rx="2" />
            <rect x="52" y="106" width="16" height="10" rx="2" />
          </g>
        );
      case "quadriceps":
        return (
          <g {...common}>
            <path d="M43,152 Q41,170 44,188 L55,188 Q56,170 55,152 Z" />
            <path d="M77,152 Q79,170 76,188 L65,188 Q64,170 65,152 Z" />
          </g>
        );
      case "mollets":
        return (
          <g {...common}>
            <path d="M46,196 Q44,208 48,214 L55,214 Q56,206 55,196 Z" />
            <path d="M74,196 Q76,208 72,214 L65,214 Q64,206 65,196 Z" />
          </g>
        );
      default:
        return null;
    }
  } else {
    switch (region) {
      case "dos":
        return (
          <g {...common}>
            <path d="M42,44 Q52,42 60,44 Q68,42 78,44 L80,90 Q70,96 60,96 Q50,96 40,90 Z" />
          </g>
        );
      case "epaules":
        return (
          <g {...common}>
            <path d="M32,42 Q28,50 34,58 Q40,50 40,44 Z" />
            <path d="M88,42 Q92,50 86,58 Q80,50 80,44 Z" />
          </g>
        );
      case "triceps":
        return (
          <g {...common}>
            <path d="M26,64 Q22,84 27,96 L33,94 Q33,80 32,66 Z" />
            <path d="M94,64 Q98,84 93,96 L87,94 Q87,80 88,66 Z" />
          </g>
        );
      case "avant_bras":
        return (
          <g {...common}>
            <path d="M26,100 Q24,120 28,138 L34,136 Q32,118 32,100 Z" />
            <path d="M94,100 Q96,120 92,138 L86,136 Q88,118 88,100 Z" />
          </g>
        );
      case "fessiers":
        return (
          <g {...common}>
            <path d="M42,126 Q45,148 58,148 L58,128 Z" />
            <path d="M78,126 Q75,148 62,148 L62,128 Z" />
          </g>
        );
      case "ischios":
        return (
          <g {...common}>
            <path d="M43,152 Q41,172 45,190 L55,190 Q56,172 55,152 Z" />
            <path d="M77,152 Q79,172 75,190 L65,190 Q64,172 65,152 Z" />
          </g>
        );
      case "mollets":
        return (
          <g {...common}>
            <path d="M46,196 Q44,208 48,214 L55,214 Q56,206 55,196 Z" />
            <path d="M74,196 Q76,208 72,214 L65,214 Q64,206 65,196 Z" />
          </g>
        );
      default:
        return null;
    }
  }
}
