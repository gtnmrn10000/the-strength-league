import leagueNaturelle from "@/assets/league-naturelle.png";
import leagueOlympien from "@/assets/league-olympien.png";

const sizes = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-16 w-16",
} as const;

export default function LeagueIcon({ league, size = "sm" }: { league: string | null; size?: keyof typeof sizes }) {
  const src = league === "naturelle" ? leagueNaturelle : leagueOlympien;
  const alt = league === "naturelle" ? "Ligue Naturelle" : "Ligue Olympien";
  return <img src={src} alt={alt} className={`${sizes[size]} rounded object-contain`} />;
}

export { leagueNaturelle, leagueOlympien };
