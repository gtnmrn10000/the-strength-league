import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Sparkles } from "lucide-react";
import { fetchSuggestions, type PublicProfile } from "@/lib/social";
import UserAvatar from "@/components/centuria/social/UserAvatar";
import FollowButton from "@/components/centuria/social/FollowButton";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
  head: () => ({
    meta: [
      { title: "Découvrir — Centuria" },
      { name: "description", content: "Découvre les athlètes les plus actifs et suis leurs PR sur Centuria." },
    ],
  }),
});

function DiscoverPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions().then((r) => {
      setList(r);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-arena-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/" })} className="text-arena-muted">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black">Découvrir</h1>
      </header>

      <div className="px-4 py-4">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-arena-gold/30 bg-arena-gold/5 p-3">
          <Sparkles size={16} className="text-arena-gold" />
          <p className="text-xs text-arena-gold">
            Suis des athlètes pour peupler ton feed avec leurs PR et repas.
          </p>
        </div>

        {loading && <p className="text-center text-sm text-arena-muted">Chargement…</p>}

        {!loading && list.length === 0 && (
          <p className="text-center text-sm text-arena-muted">
            Aucun compte à suggérer pour l'instant. Reviens quand la communauté grandit.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {list.map((p) => {
            const grade = (p.current_grade || "recruit") as Grade;
            return (
              <div key={p.user_id} className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3">
                <Link to="/profile/$userId" params={{ userId: p.user_id }} className="flex flex-1 items-center gap-3">
                  <UserAvatar src={p.avatar_url} pseudo={p.pseudo} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-black text-foreground">{p.pseudo}</p>
                    <p className="truncate text-[10px] font-black tracking-wider text-arena-gold">
                      {GRADE_EMOJIS[grade]} {GRADE_LABELS[grade]?.toUpperCase()}
                    </p>
                    <p className="text-[11px] text-arena-sub">
                      {p.followers_count} followers · {p.posts_count} posts
                    </p>
                  </div>
                </Link>
                <FollowButton targetId={p.user_id} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
