import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Sparkles, Search, X } from "lucide-react";
import { fetchSuggestions, searchProfiles, type PublicProfile } from "@/lib/social";
import UserAvatar from "@/components/centuria/social/UserAvatar";
import FollowButton from "@/components/centuria/social/FollowButton";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradeEmblem } from "@/components/centuria/grades/GradeEmblem";

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
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PublicProfile[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchSuggestions().then((r) => {
      setList(r);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchProfiles(q).then((r) => {
        setResults(r);
        setSearching(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [term]);

  const shown = results ?? list;
  const isSearch = results !== null;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-arena-border bg-background/95 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
        <button onClick={() => navigate({ to: "/" })} className="text-arena-muted" aria-label="Retour">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black">Découvrir</h1>
      </header>

      <div className="px-4 py-4">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-arena-muted" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Chercher un pseudo…"
            className="w-full rounded-full border border-arena-border bg-arena-surface py-3 pl-9 pr-9 text-sm text-foreground outline-none focus:border-arena/50"
          />
          {term && (
            <button
              onClick={() => setTerm("")}
              aria-label="Effacer"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-arena-muted"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {!isSearch && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-arena-gold/30 bg-arena-gold/5 p-3">
            <Sparkles size={16} className="text-arena-gold" />
            <p className="text-xs text-arena-gold">
              Suis des athlètes pour peupler ton feed avec leurs PR et repas.
            </p>
          </div>
        )}

        {(loading || searching) && (
          <p className="text-center text-sm text-arena-muted">Chargement…</p>
        )}

        {!loading && !searching && shown.length === 0 && (
          <p className="text-center text-sm text-arena-muted">
            {isSearch
              ? "Aucun athlète ne correspond à cette recherche."
              : "Aucun compte à suggérer pour l'instant. Reviens quand la communauté grandit."}
          </p>
        )}


        <div className="flex flex-col gap-3">
          {shown.map((p) => {
            const grade = (p.current_grade || "recruit") as Grade;
            return (
              <div key={p.user_id} className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3">
                <Link to="/profile/$userId" params={{ userId: p.user_id }} className="flex flex-1 items-center gap-3">
                  <UserAvatar src={p.avatar_url} pseudo={p.pseudo} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-black text-foreground">{p.pseudo}</p>
                    <p className="inline-flex items-center gap-1 truncate text-[10px] font-semibold text-arena-gold">
                      <GradeEmblem grade={grade} size={22} /> {GRADE_LABELS[grade]}
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
