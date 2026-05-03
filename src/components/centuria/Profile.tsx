import { MapPin, ShieldCheck, Settings, Trophy, Flame, Dumbbell, Target } from "lucide-react";
import { loadUserProfile, goalLabel, goalEmoji, leagueLabel, leagueColor } from "./userProfile";

export default function Profile() {
  const profile = loadUserProfile();
  const lc = leagueColor(profile?.league ?? null);

  return (
    <div className="px-4 pt-2 pb-4">
      <CombatCard profile={profile} lc={lc} />

      <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">PROGRESSION</h3>
      <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Vers Gladiateur</span>
          <span className="text-sm font-black text-arena">0%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-arena" style={{ width: "0%" }} />
        </div>
        <p className="mt-2 text-[10px] text-arena-muted">Log ton premier PR pour progresser vers le grade suivant.</p>
      </div>

      {profile?.goal && (
        <>
          <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">OBJECTIF ACTUEL</h3>
          <div className="rounded-2xl border border-arena-border bg-arena-surface p-4 flex items-center gap-3">
            <span className="text-2xl">{goalEmoji(profile.goal)}</span>
            <div>
              <p className="font-black text-foreground">{goalLabel(profile.goal)}</p>
              <p className="text-xs text-arena-sub">Défini à l'inscription · Modifiable dans les réglages</p>
            </div>
          </div>
        </>
      )}

      <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">BADGES</h3>
      <div className="flex gap-2">
        {["Recrue", "Nouveau"].map((x) => (
          <div key={x} className="flex items-center gap-1 rounded-full bg-arena/10 px-3 py-1.5">
            <Target size={12} className="text-arena" />
            <span className="text-[10px] font-bold text-arena">{x}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CombatCard({ profile, lc }: { profile: ReturnType<typeof loadUserProfile>; lc: { text: string; bg: string } }) {
  const pseudo = profile?.pseudo || "Gladiateur";
  const age = profile?.age ? `${profile.age} ans` : "";
  const poids = profile?.poids ? `${profile.poids}kg` : "";
  const meta = [age, poids].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">{pseudo}</h2>
          <p className="text-xs text-arena-sub">@{pseudo.toLowerCase().replace(/\s/g, "_")}</p>
          {meta && (
            <p className="mt-1 flex items-center gap-1 text-xs text-arena-sub">
              <MapPin size={12} /> {meta}
            </p>
          )}
        </div>
        <Settings size={20} className="text-arena-muted" />
      </div>

      <div className="mt-3 flex gap-4">
        <Mini icon={Flame} label="Streak" value="0j" />
        <Mini icon={Dumbbell} label="PRs" value="0" />
        <Mini icon={Trophy} label="Rank" value="#—" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {profile?.league && (
          <span className={`rounded-full ${lc.bg} px-2 py-0.5 text-[10px] font-bold ${lc.text}`}>
            Ligue {leagueLabel(profile.league)}
          </span>
        )}
        <span className="rounded-full bg-arena/10 px-2 py-0.5 text-[10px] font-bold text-arena">RECRUE</span>
      </div>

      {profile?.league === "naturelle" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-arena-green">
          <ShieldCheck size={14} />
          <span>Drug-free — En attente de vérification</span>
        </div>
      )}
      {profile?.league === "olympien" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-arena-purple">
          <Flame size={14} />
          <span>Olympien — Aucune limite, force absolue</span>
        </div>
      )}

      <h4 className="mb-2 mt-4 text-xs font-black text-arena-muted">PR vérifiés</h4>
      <div className="rounded-xl bg-secondary p-4 text-center">
        <p className="text-xs text-arena-muted">Aucun PR enregistré pour le moment.</p>
        <p className="mt-1 text-[10px] text-arena-sub">Log ton premier PR pour commencer 💪</p>
      </div>

      <button className="mt-4 w-full rounded-xl border border-arena-border py-2 text-xs font-bold text-arena-sub">
        Partager ma carte
      </button>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <Icon size={16} className="text-arena" />
      <span className="mt-1 text-sm font-black text-foreground">{value}</span>
      <span className="text-[10px] text-arena-sub">{label}</span>
    </div>
  );
}
