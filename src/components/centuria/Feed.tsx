import { useState } from "react";
import { Flame, ShieldCheck, Save, Plus, Crown, Zap, X, Swords, Trophy, Target } from "lucide-react";

const posts = [
  {
    type: "pr" as const,
    user: "Lucas",
    avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=400&auto=format&fit=crop",
    league: "NATURELLE",
    grade: "GLADIATEUR",
    exercise: "BENCH PRESS",
    value: "130 KG",
    ratio: "1,55x BW",
    hype: 284,
    time: "il y a 2h",
  },
  {
    type: "meal" as const,
    user: "Anaïs",
    avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?q=80&w=400&auto=format&fit=crop",
    title: "Petit-déj prise de masse",
    kcal: "850 kcal · 65g prot",
    photo: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=900&auto=format&fit=crop",
    hype: 119,
  },
  {
    type: "level" as const,
    user: "Maxime",
    from: "SPARTIATE",
    to: "GLADIATEUR",
    hype: 531,
  },
];

export default function Feed({ onCreate }: { onCreate: () => void }) {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="px-4 pt-2 pb-4">
      {showWelcome && <WelcomeBanner onClose={() => setShowWelcome(false)} />}
      <QuickStats />
      <WarBanner />
      <FounderBanner />
      <h3 className="mb-3 mt-5 text-xs font-black tracking-widest text-arena-muted">FEED</h3>
      <div className="flex flex-col gap-4">
        {posts.map((p, i) => (
          <PostCard key={i} post={p} />
        ))}
      </div>
      <button
        onClick={onCreate}
        className="fixed bottom-20 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-arena text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] active:scale-90 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
function WelcomeBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-3 rounded-2xl border border-arena/30 bg-gradient-to-br from-arena/10 to-arena-gold/5 p-4 relative">
      <button onClick={onClose} className="absolute top-3 right-3 text-arena-muted hover:text-foreground transition-colors">
        <X size={16} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Swords size={18} className="text-arena" />
        <span className="text-sm font-black text-foreground">Bienvenue, Gladiateur.</span>
      </div>
      <p className="text-xs text-arena-sub leading-relaxed">
        Ton arène est prête. Log ton premier PR pour débloquer ton grade et entrer dans le classement.
      </p>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-arena/20 px-2.5 py-1 text-[10px] font-bold text-arena">🎯 Log un PR</span>
        <span className="rounded-full bg-arena-gold/20 px-2.5 py-1 text-[10px] font-bold text-arena-gold">⚡ +100 XP offerts</span>
      </div>
    </div>
  );
}

function QuickStats() {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {[
        { icon: Trophy, label: "Rank", value: "#—", color: "text-arena-gold" },
        { icon: Target, label: "Grade", value: "RECRUE", color: "text-arena" },
        { icon: Flame, label: "Streak", value: "1j", color: "text-arena" },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-arena-border bg-arena-surface p-3">
          <Icon size={16} className={color} />
          <span className="text-sm font-black text-foreground">{value}</span>
          <span className="text-[10px] text-arena-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
function WarBanner() {
  return (
    <div className="mb-3 rounded-2xl border border-arena-border bg-arena-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-arena">Guerre — Saison 1</span>
        <span className="text-xs font-bold text-arena">J-47</span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4">
        <span className="text-sm font-black text-foreground">⚔️ VS ⚔️</span>
      </div>
      <p className="mt-2 text-center text-xs text-arena-sub">Olympiens en tête : +277k</p>
    </div>
  );
}

function FounderBanner() {
  return (
    <div className="rounded-2xl border border-arena-gold/30 bg-arena-gold/5 p-4">
      <div className="flex items-center gap-2">
        <Crown size={16} className="text-arena-gold" />
        <span className="text-sm font-black text-arena-gold">Founder Lifetime</span>
      </div>
      <p className="mt-1 text-xs text-arena-sub">99€ à vie · 847/1000 places restantes</p>
    </div>
  );
}

function PostCard({ post }: { post: (typeof posts)[number] }) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
      {post.type === "pr" && <PRPost post={post} />}
      {post.type === "meal" && <MealPost post={post} />}
      {post.type === "level" && <LevelPost post={post} />}
      <Actions hype={post.hype} save={post.type === "pr"} />
    </div>
  );
}

function PRPost({ post }: { post: any }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <img src={post.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-arena-border" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{post.user}</span>
            <span className="text-xs text-arena-gold">{post.grade}</span>
          </div>
          <span className="text-xs text-arena-sub">{post.time}</span>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-arena-green">NATURELLE</span>
      </div>
      <div className="mt-3 rounded-xl bg-secondary p-3">
        <p className="text-xs font-bold text-arena-sub">{post.exercise}</p>
        <p className="mt-1 text-xl font-black text-foreground">{post.value} · <span className="text-arena">NEW PR</span></p>
        <p className="mt-1 text-xs text-arena-sub">Ratio : {post.ratio} · Spartiate Bench</p>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-arena-green">
        <ShieldCheck size={14} />
        <span className="font-bold">PR VÉRIFIÉ IA</span>
      </div>
    </>
  );
}

function MealPost({ post }: { post: any }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <img src={post.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-arena-border" />
        <div>
          <span className="font-bold text-foreground">{post.user}</span>
          <p className="text-xs text-arena-sub">Grade nutrition · Athlète</p>
        </div>
      </div>
      <img src={post.photo} alt={post.title} className="mt-3 h-40 w-full rounded-xl object-cover" />
      <p className="mt-2 font-bold text-foreground">{post.title}</p>
      <p className="text-xs text-arena-sub">{post.kcal}</p>
      <div className="mt-2 flex gap-2">
        {["Prise de masse", "Budget", "Express"].map((t) => (
          <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-arena-sub">{t}</span>
        ))}
      </div>
    </>
  );
}

function LevelPost({ post }: { post: any }) {
  return (
    <div className="text-center">
      <Zap size={24} className="mx-auto text-arena-gold" />
      <p className="mt-2 text-xs font-bold text-arena-gold">Level up</p>
      <p className="mt-1 text-lg font-black text-foreground">{post.user} passe {post.to}</p>
      <p className="mt-1 text-xs text-arena-sub">{post.from} → {post.to} · +500 XP</p>
    </div>
  );
}

function Actions({ hype, save }: { hype: number; save?: boolean }) {
  return (
    <div className="mt-3 flex items-center gap-4 text-arena-sub">
      <button className="flex items-center gap-1 text-xs">
        <Flame size={16} />
        <span>{hype}</span>
      </button>
      {save && (
        <button className="flex items-center gap-1 text-xs">
          <Save size={16} />
        </button>
      )}
    </div>
  );
}
