import { useState } from "react";
import Feed from "./Feed";
import Rankings from "./Rankings";

/**
 * Communauté = le fil social et le classement, réunis sous un segment
 * simple. Le feed n'est plus l'écran d'accueil de l'app.
 */
export default function Community({ onCreate }: { onCreate: () => void }) {
  const [seg, setSeg] = useState<"feed" | "rank">("feed");

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 px-4 pb-2 pt-2 backdrop-blur-md">
        <div className="flex rounded-xl border border-arena-border bg-arena-surface p-1">
          {(
            [
              { id: "feed", label: "Fil" },
              { id: "rank", label: "Classement" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setSeg(s.id)}
              className={`min-h-[36px] flex-1 rounded-lg text-xs font-bold transition ${
                seg === s.id
                  ? "bg-arena text-arena-foreground"
                  : "text-arena-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {seg === "feed" ? <Feed onCreate={onCreate} /> : <Rankings />}
    </div>
  );
}
