import { motion } from "framer-motion";
import { Flame, ShieldCheck, Camera, NotebookPen, Save, Plus, Crown, Zap, Trophy } from "lucide-react";

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
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-2 pb-4">
      <WarBanner />
      <FounderBanner />
      <div className="mt-4 flex flex-col gap-4">
        {posts.map((p, i) => (
          <PostCard key={i} post={p} />
        ))}
      </div>
      <Fab onClick={onCreate} />
    </motion.div>
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
        <Avatar src={post.avatar} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{post.user}</span>
            <span className="text-xs text-arena-gold">{post.grade}</span>
          </div>
          <span className="text-xs text-arena-sub">{post.time}</span>
        </div>
        <Badge color="text-arena-green">NATURELLE</Badge>
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
        <Avatar src={post.avatar} />
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
          <Tag key={t}>{t}</Tag>
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

function Avatar({ src }: { src: string }) {
  return <img src={src} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-arena-border" />;
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold ${color}`}>{children}</span>;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-arena-sub">{children}</span>;
}

function Fab({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-arena text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
    >
      <Plus size={24} />
    </motion.button>
  );
}
