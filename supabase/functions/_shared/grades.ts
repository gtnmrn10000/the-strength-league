export const GRADES = [
  "recruit", "soldat", "guerrier", "spartiate", "gladiateur",
  "centurion", "titan", "legende", "divin",
] as const;

export type Grade = (typeof GRADES)[number];

export const GRADE_XP: Record<Grade, number> = {
  recruit: 0, soldat: 300, guerrier: 800, spartiate: 1600, gladiateur: 2800,
  centurion: 4500, titan: 7000, legende: 10500, divin: 15000,
};

export function gradeForXp(xp: number): Grade {
  let idx = 0;
  for (let i = GRADES.length - 1; i >= 0; i--) {
    if (xp >= GRADE_XP[GRADES[i]]) { idx = i; break; }
  }
  return GRADES[idx];
}
