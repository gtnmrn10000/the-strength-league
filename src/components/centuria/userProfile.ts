export interface UserProfile {
  pseudo: string;
  age: string;
  taille: string;
  poids: string;
  goal: string | null;
}

const PROFILE_KEY = "centuria_profile";

export function saveUserProfile(data: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export function loadUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function goalLabel(goal: string | null): string {
  switch (goal) {
    case "masse": return "Prise de masse";
    case "seche": return "Sèche";
    case "performance": return "Performance";
    default: return "Non défini";
  }
}

export function goalEmoji(goal: string | null): string {
  switch (goal) {
    case "masse": return "💪";
    case "seche": return "🔥";
    case "performance": return "⚡";
    default: return "🎯";
  }
}
