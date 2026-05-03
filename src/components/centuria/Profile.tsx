import { MapPin, ShieldCheck, Settings, Trophy, Flame, Dumbbell } from "lucide-react";

export default function Profile() {
  return (
    <div className="px-4 pt-2 pb-4">
      <CombatCard />

      <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">PROGRESSION</h3>
      <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Vers Gladiateur</span>
          <span className="text-sm font-black text-arena">78%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-arena" style={{ width: "78%" }} />
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-xs font-black tracking-widest text-arena-muted">BADGES</h3>
      <div className="flex gap-2">
        {["Streak 87", "PR IA", "Top 2%"].map((x) => (
          <div key={x} className="flex items-center gap-1 rounded-full bg-arena-gold/10 px-3 py-1.5">
            <Trophy size={12} className="text-arena-gold" />
            <span className="text-[10px] font-bold text-arena-gold">{x}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CombatCard() {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">Maxime D.</h2>
          <p className="text-xs text-arena-sub">@maxime_lifts</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-arena-sub">
            <MapPin size={12} /> Lyon · 22 ans · 84kg
          </p>
        </div>
        <Settings size={20} className="text-arena-muted" />
      </div>

      <div className="mt-3 flex gap-4">
        <Mini icon={Flame} label="Streak" value="87j" />
        <Mini icon={Dumbbell} label="PRs" value="12" />
        <Mini icon={Trophy} label="Rank" value="#847" />
      </div>

      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-arena-green/10 px-2 py-0.5 text-[10px] font-bold text-arena-green">Ligue naturelle</span>
        <span className="rounded-full bg-arena-gold/10 px-2 py-0.5 text-[10px] font-bold text-arena-gold">Spartiate</span>
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs text-arena-green">
        <ShieldCheck size={14} />
        <span>Testé naturel — Juin 2026</span>
      </div>

      <h4 className="mb-2 mt-4 text-xs font-black text-arena-muted">PR vérifiés</h4>
      <div className="grid grid-cols-3 gap-2">
        {([["Squat", "180kg"], ["Bench", "130kg"], ["Deadlift", "220kg"], ["Total", "530kg"], ["Wilks", "372"]] as const).map(([a, b]) => (
          <div key={a} className="rounded-xl bg-secondary p-2 text-center">
            <p className="text-[10px] text-arena-sub">{a}</p>
            <p className="text-sm font-black text-foreground">{b} ✅</p>
          </div>
        ))}
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
