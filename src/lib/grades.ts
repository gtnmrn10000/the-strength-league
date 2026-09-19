/**
 * CENTURIA Grade System — shared pure logic (safe for client + server)
 *
 * Le grade d'un athlète (`current_grade`) dérive désormais uniquement de
 * son XP réel (voir GRADE_XP), gagné via des actions vérifiées côté
 * serveur (séance terminée, régularité, PR). Les ratios squat/bench/
 * deadlift ci-dessous ne servent plus qu'à calculer des "badges de force"
 * par mouvement (voir computeGradeForLift) — ils n'influencent plus
 * current_grade.
 */

export const GRADES = [
  "recruit",
  "soldat",
  "guerrier",
  "spartiate",
  "gladiateur",
  "centurion",
  "titan",
  "legende",
  "divin",
] as const;

export type Grade = (typeof GRADES)[number];

/**
 * Seuils XP cumulés pour débloquer chaque grade.
 * Progression volontairement croissante (paliers de plus en plus longs) :
 * les premiers rangs tombent vite (quelques séances), les derniers
 * demandent une vraie régularité sur plusieurs mois.
 *   recruit     0 XP   — point de départ
 *   soldat    300 XP   — ~1 semaine de séances régulières
 *   guerrier  800 XP   — ~1 mois
 *   spartiate 1600 XP  — ~2 mois
 *   gladiateur 2800 XP — ~3-4 mois
 *   centurion 4500 XP  — ~6 mois
 *   titan     7000 XP  — ~9 mois
 *   legende   10500 XP — ~1 an
 *   divin     15000 XP — élite, régularité longue + PRs communautaires
 */
export const GRADE_XP: Record<Grade, number> = {
  recruit: 0,
  soldat: 300,
  guerrier: 800,
  spartiate: 1600,
  gladiateur: 2800,
  centurion: 4500,
  titan: 7000,
  legende: 10500,
  divin: 15000,
};

export const THRESHOLDS: Record<string, number[]> = {
  squat:    [0, 0.8, 1.2, 1.6, 2.0, 2.3, 2.6, 3.0, 3.5],
  bench:    [0, 0.6, 0.9, 1.2, 1.5, 1.8, 2.0, 2.3, 2.6],
  deadlift: [0, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.5, 4.0],
};

export const GRADE_LABELS: Record<Grade, string> = {
  recruit: "Recrue",
  soldat: "Soldat",
  guerrier: "Guerrier",
  spartiate: "Spartiate",
  gladiateur: "Gladiateur",
  centurion: "Centurion",
  titan: "Titan",
  legende: "Légende",
  divin: "Divin",
};

/** Grade correspondant à un total d'XP donné. */
export function gradeForXp(xp: number): Grade {
  let idx = 0;
  for (let i = GRADES.length - 1; i >= 0; i--) {
    if (xp >= GRADE_XP[GRADES[i]]) {
      idx = i;
      break;
    }
  }
  return GRADES[idx];
}

export interface NextGradeInfo {
  /** Grade actuel déduit de l'XP. */
  grade: Grade;
  /** Grade suivant, ou null si grade maximum atteint. */
  nextGrade: Grade | null;
  /** Seuil XP du grade actuel. */
  currentThreshold: number;
  /** Seuil XP du grade suivant, ou null si maximum. */
  nextThreshold: number | null;
  /** XP restant avant le prochain grade (0 si maximum). */
  xpRemaining: number;
  /** Progression en % dans le palier courant (100 si maximum). */
  progressPct: number;
}

/** Calcule la progression vers le grade suivant à partir de l'XP. */
export function nextGradeInfo(xp: number): NextGradeInfo {
  const grade = gradeForXp(xp);
  const idx = GRADES.indexOf(grade);
  const isMax = idx === GRADES.length - 1;
  const currentThreshold = GRADE_XP[grade];

  if (isMax) {
    return {
      grade,
      nextGrade: null,
      currentThreshold,
      nextThreshold: null,
      xpRemaining: 0,
      progressPct: 100,
    };
  }

  const nextGrade = GRADES[idx + 1];
  const nextThreshold = GRADE_XP[nextGrade];
  const span = nextThreshold - currentThreshold;
  const progressPct = span > 0
    ? Math.min(100, Math.max(0, Math.round(((xp - currentThreshold) / span) * 100)))
    : 100;

  return {
    grade,
    nextGrade,
    currentThreshold,
    nextThreshold,
    xpRemaining: Math.max(0, nextThreshold - xp),
    progressPct,
  };
}

function gradeIndexForLift(exercise: string, ratio: number): number {
  const thresholds = THRESHOLDS[exercise];
  if (!thresholds) return 0;
  let idx = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) {
      idx = i;
      break;
    }
  }
  return idx;
}

/**
 * @deprecated Ne détermine plus `current_grade`. Conservé uniquement pour
 * compatibilité historique — préférer `computeGradeForLift` par mouvement
 * (badges de force), et `gradeForXp` pour le grade réel du profil.
 */
export function computeGrade(
  bodyweight: number,
  bestLifts: { squat: number; bench: number; deadlift: number }
): Grade {
  if (bodyweight <= 0) return "recruit";
  const squatIdx = gradeIndexForLift("squat", bestLifts.squat / bodyweight);
  const benchIdx = gradeIndexForLift("bench", bestLifts.bench / bodyweight);
  const dlIdx = gradeIndexForLift("deadlift", bestLifts.deadlift / bodyweight);
  const best = Math.max(squatIdx, benchIdx, dlIdx);
  return GRADES[best];
}

/**
 * Badge de force pour un mouvement donné (squat/bench/deadlift), basé sur
 * le ratio charge/poids de corps. N'affecte pas `current_grade`.
 */
export function computeGradeForLift(
  exercise: string,
  weightKg: number,
  bodyweight: number
): Grade {
  if (bodyweight <= 0) return "recruit";
  const idx = gradeIndexForLift(exercise, weightKg / bodyweight);
  return GRADES[idx];
}
