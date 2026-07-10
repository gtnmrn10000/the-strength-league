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

/** Retourne un tier d'intensité 0..3 (0 = neutre). */
function tierFor(intensity: number | undefined): 0 | 1 | 2 | 3 {
  if (!intensity) return 0;
  if (intensity >= 0.75) return 3;
  if (intensity >= 0.5) return 2;
  if (intensity >= 0.25) return 1;
  return 1;
}

export type MuscleIntensity = Partial<Record<Region, number>>;

/**
 * Silhouette anatomique premium (avant + arrière).
 * Muscles ciblés rendus en dégradé or fluide, glow rouge sang sur haute intensité.
 */
export default function BodyDiagram({
  intensities,
  targets,
}: {
  intensities?: MuscleIntensity;
  targets?: string[];
}) {
  const getInt = (r: Region) => intensities?.[r];
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
          <LegendDot color="hsl(45 90% 60%)" label="ciblé" />
          <LegendDot color="hsl(0 75% 55%)" label="intense" />
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

/** Défs partagées : dégradés or + rouge sang, filtres glow. */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      {/* Peau : gris très sombre avec léger volume */}
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a1d" />
        <stop offset="100%" stopColor="#0d0d0f" />
      </linearGradient>
      {/* Or clair (tier 1) */}
      <radialGradient id={`${id}-gold-1`} cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#a88434" />
        <stop offset="100%" stopColor="#4a3818" />
      </radialGradient>
      {/* Or moyen (tier 2) */}
      <radialGradient id={`${id}-gold-2`} cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#f2d06b" />
        <stop offset="60%" stopColor="#c89a3a" />
        <stop offset="100%" stopColor="#5a4118" />
      </radialGradient>
      {/* Or intense + rouge sang (tier 3) */}
      <radialGradient id={`${id}-gold-3`} cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#ffe58a" />
        <stop offset="45%" stopColor="#e8b846" />
        <stop offset="85%" stopColor="#8a3020" />
        <stop offset="100%" stopColor="#3a0c08" />
      </radialGradient>
      {/* Glow rouge sang autour du muscle chaud */}
      <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Vignette centrale */}
      <radialGradient id={`${id}-shade`} cx="50%" cy="50%" r="60%">
        <stop offset="60%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
      </radialGradient>
    </defs>
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
  const id = `bd-${view}`;
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 140 260"
        width="100%"
        className="max-h-72"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs id={id} />

        {/* Silhouette de base — anatomiquement lissée */}
        <g fill={`url(#${id}-skin)`} stroke="rgba(212,175,55,0.18)" strokeWidth="0.6">
          {/* Tête */}
          <path d="M70,6 C79,6 86,13 86,23 C86,32 80,39 70,39 C60,39 54,32 54,23 C54,13 61,6 70,6 Z" />
          {/* Cou + trapèzes */}
          <path d="M62,38 L78,38 L82,48 C82,50 80,52 76,52 L64,52 C60,52 58,50 58,48 Z" />
          {/* Torse + épaules */}
          <path d="M40,52 C34,54 30,60 28,72 C26,86 27,100 30,116 C32,128 35,138 40,146 L100,146 C105,138 108,128 110,116 C113,100 114,86 112,72 C110,60 106,54 100,52 C92,50 82,49 70,49 C58,49 48,50 40,52 Z" />
          {/* Bras gauche (haut) */}
          <path d="M30,60 C22,66 18,78 18,94 C18,108 20,122 24,134 L34,134 C34,120 34,108 36,94 C37,82 38,72 40,64 Z" />
          {/* Bras droit (haut) */}
          <path d="M110,60 C118,66 122,78 122,94 C122,108 120,122 116,134 L106,134 C106,120 106,108 104,94 C103,82 102,72 100,64 Z" />
          {/* Avant-bras gauche */}
          <path d="M22,134 C21,148 22,160 26,172 L36,172 C36,160 36,148 34,134 Z" />
          {/* Avant-bras droit */}
          <path d="M118,134 C119,148 118,160 114,172 L104,172 C104,160 104,148 106,134 Z" />
          {/* Mains */}
          <ellipse cx="30" cy="180" rx="5" ry="7" />
          <ellipse cx="110" cy="180" rx="5" ry="7" />
          {/* Bassin */}
          <path d="M40,146 C39,156 40,164 44,172 L96,172 C100,164 101,156 100,146 Z" />
          {/* Jambe gauche */}
          <path d="M44,172 C42,190 43,208 46,224 C48,236 50,246 54,254 L64,254 C65,244 65,232 65,220 C65,204 64,188 62,172 Z" />
          {/* Jambe droite */}
          <path d="M96,172 C98,190 97,208 94,224 C92,236 90,246 86,254 L76,254 C75,244 75,232 75,220 C75,204 76,188 78,172 Z" />
        </g>

        {/* Overlays muscle par muscle */}
        {regions.map((r) => (
          <MuscleShape
            key={r}
            view={view}
            region={r}
            tier={tierFor(getInt(r))}
            defsId={id}
          />
        ))}

        {/* Vignette au-dessus pour intégrer visuellement */}
        <rect x="0" y="0" width="140" height="260" fill={`url(#${id}-shade)`} pointerEvents="none" />
      </svg>
      <p className="mt-1 text-[9px] font-black tracking-[0.2em] text-arena-muted">
        {view === "front" ? "AVANT" : "ARRIÈRE"}
      </p>
    </div>
  );
}

function MuscleShape({
  view,
  region,
  tier,
  defsId,
}: {
  view: "front" | "back";
  region: Region;
  tier: 0 | 1 | 2 | 3;
  defsId: string;
}) {
  if (tier === 0) return null;
  const fill = `url(#${defsId}-gold-${tier})`;
  const opacity = tier === 1 ? 0.55 : tier === 2 ? 0.85 : 1;
  const filter = tier === 3 ? `url(#${defsId}-glow)` : undefined;
  const stroke = tier >= 2 ? "rgba(255,215,120,0.35)" : "transparent";
  const common = { fill, opacity, filter, stroke, strokeWidth: 0.4 } as const;

  if (view === "front") {
    switch (region) {
      case "pectoraux":
        return (
          <g {...common}>
            <path d="M46,58 C56,55 66,55 68,58 L68,80 C60,84 50,82 44,78 C42,70 42,63 46,58 Z" />
            <path d="M94,58 C84,55 74,55 72,58 L72,80 C80,84 90,82 96,78 C98,70 98,63 94,58 Z" />
          </g>
        );
      case "epaules":
        return (
          <g {...common}>
            <path d="M34,55 C28,60 26,70 30,80 C38,74 42,66 44,58 Z" />
            <path d="M106,55 C112,60 114,70 110,80 C102,74 98,66 96,58 Z" />
          </g>
        );
      case "biceps":
        return (
          <g {...common}>
            <path d="M24,80 C20,94 20,108 26,120 L34,118 C34,104 35,92 36,82 Z" />
            <path d="M116,80 C120,94 120,108 114,120 L106,118 C106,104 105,92 104,82 Z" />
          </g>
        );
      case "avant_bras":
        return (
          <g {...common}>
            <path d="M24,136 C22,150 24,164 28,172 L36,170 C34,158 34,146 34,136 Z" />
            <path d="M116,136 C118,150 116,164 112,172 L104,170 C106,158 106,146 106,136 Z" />
          </g>
        );
      case "abdos":
        return (
          <g {...common}>
            <path d="M60,86 Q70,84 80,86 L80,144 Q70,148 60,144 Z" opacity={0.15 * opacity} />
            {/* 4 packs */}
            <rect x="61" y="88" width="8" height="11" rx="2" />
            <rect x="71" y="88" width="8" height="11" rx="2" />
            <rect x="61" y="101" width="8" height="11" rx="2" />
            <rect x="71" y="101" width="8" height="11" rx="2" />
            <rect x="61" y="114" width="8" height="11" rx="2" />
            <rect x="71" y="114" width="8" height="11" rx="2" />
            <path d="M60,128 Q70,132 80,128 L78,142 Q70,146 62,142 Z" />
          </g>
        );
      case "quadriceps":
        return (
          <g {...common}>
            <path d="M46,176 C43,196 45,214 50,224 L62,222 C64,206 64,190 63,176 Z" />
            <path d="M94,176 C97,196 95,214 90,224 L78,222 C76,206 76,190 77,176 Z" />
          </g>
        );
      case "mollets":
        return (
          <g {...common}>
            <path d="M50,228 C48,240 50,250 54,254 L62,254 C63,244 63,236 62,228 Z" />
            <path d="M90,228 C92,240 90,250 86,254 L78,254 C77,244 77,236 78,228 Z" />
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
            {/* Trapèze */}
            <path d="M56,52 C64,50 76,50 84,52 L88,68 C78,72 62,72 52,68 Z" />
            {/* Grand dorsal */}
            <path d="M44,70 C50,68 62,70 70,70 C78,70 90,68 96,70 L100,110 C92,120 78,124 70,124 C62,124 48,120 40,110 Z" />
          </g>
        );
      case "epaules":
        return (
          <g {...common}>
            <path d="M34,55 C28,60 26,70 30,80 C38,74 42,66 44,58 Z" />
            <path d="M106,55 C112,60 114,70 110,80 C102,74 98,66 96,58 Z" />
          </g>
        );
      case "triceps":
        return (
          <g {...common}>
            <path d="M24,80 C20,98 22,114 28,124 L36,122 C36,106 36,92 36,82 Z" />
            <path d="M116,80 C120,98 118,114 112,124 L104,122 C104,106 104,92 104,82 Z" />
          </g>
        );
      case "avant_bras":
        return (
          <g {...common}>
            <path d="M24,136 C22,150 24,164 28,172 L36,170 C34,158 34,146 34,136 Z" />
            <path d="M116,136 C118,150 116,164 112,172 L104,170 C106,158 106,146 106,136 Z" />
          </g>
        );
      case "fessiers":
        return (
          <g {...common}>
            <path d="M44,148 C42,160 46,170 62,170 C68,170 70,166 70,158 L70,150 Z" />
            <path d="M96,148 C98,160 94,170 78,170 C72,170 70,166 70,158 L70,150 Z" />
          </g>
        );
      case "ischios":
        return (
          <g {...common}>
            <path d="M46,176 C44,198 46,214 50,224 L62,222 C64,206 64,190 63,176 Z" />
            <path d="M94,176 C96,198 94,214 90,224 L78,222 C76,206 76,190 77,176 Z" />
          </g>
        );
      case "mollets":
        return (
          <g {...common}>
            <path d="M50,228 C48,240 50,250 54,254 L62,254 C63,244 63,236 62,228 Z" />
            <path d="M90,228 C92,240 90,250 86,254 L78,254 C77,244 77,236 78,228 Z" />
          </g>
        );
      default:
        return null;
    }
  }
}
