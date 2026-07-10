import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2, AlertTriangle, Play, ChefHat, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  coachChat,
  getCoachHistory,
  clearCoachHistory,
  saveWorkoutSession,
  type ChatMsg,
  type GeneratedWorkout,
  type GeneratedRecipe,
} from "@/lib/coach.functions";

export default function CoachChat({ onSessionStarted }: { onSessionStarted?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [startingIdx, setStartingIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const h = await getCoachHistory();
        setMessages(h);
      } catch {
        // silent
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const runMessage = async (text: string) => {
    if (!text || loading) return;
    const optimistic: ChatMsg = { role: "user", content: text, at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    setLoading(true);
    try {
      const { reply, workout, recipe, warnings } = await coachChat({ data: { message: text } });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: reply,
          workout: workout ?? null,
          recipe: recipe ?? null,
          warnings: warnings ?? [],
          at: new Date().toISOString(),
        },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("PREMIUM_REQUIRED") || msg.includes("402")) toast.error("Réservé aux abonnés Premium.");
      else if (msg.includes("429")) toast.error("Trop de requêtes, réessaie dans un instant.");
      else toast.error("Le Coach n'a pas pu répondre.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    await runMessage(input.trim());
  };

  const quickAction = (label: string, prompt: string) => () => {
    if (loading) return;
    runMessage(prompt);
  };

  const clear = async () => {
    if (!confirm("Effacer tout l'historique du Coach ?")) return;
    try {
      await clearCoachHistory();
      setMessages([]);
    } catch {
      toast.error("Suppression impossible.");
    }
  };

  const startSession = async (idx: number, w: GeneratedWorkout) => {
    setStartingIdx(idx);
    try {
      await saveWorkoutSession({
        data: {
          name: w.name,
          duration_min: w.duration_min,
          muscle_groups: w.muscle_groups,
          exercises: w.exercises,
        },
      });
      toast.success("Séance envoyée dans Training ✅");
      onSessionStarted?.();
    } catch {
      toast.error("Impossible d'envoyer la séance.");
    } finally {
      setStartingIdx(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {booting ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-arena-muted" />
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-arena-border p-6 text-center">
            <p className="text-sm text-arena-muted">
              Pose ta question au Coach IA — programmation, technique, récup, nutrition. Il connaît ton profil et l'état de tes muscles.
            </p>
            <div className="mt-3 flex flex-col gap-2 text-left text-xs">
              {[
                "Génère-moi une séance push d'1 h",
                "Est-ce que je peux entraîner les jambes aujourd'hui ?",
                "Comment progresser au bench ?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-lg border border-arena-border bg-arena-surface p-2 text-left text-foreground active:scale-[0.99]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-arena text-arena-on"
                      : "border border-arena-border bg-arena-surface text-foreground"
                  }`}
                >
                  {m.content}
                </div>

                {m.role === "assistant" && m.warnings && m.warnings.length > 0 && (
                  <div className="flex w-full max-w-[95%] flex-col gap-1">
                    {m.warnings.map((w, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-100"
                      >
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-yellow-300" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {m.role === "assistant" && m.workout && (
                  <WorkoutCard
                    workout={m.workout}
                    starting={startingIdx === i}
                    onStart={() => startSession(i, m.workout!)}
                  />
                )}

                {m.role === "assistant" && m.recipe && <RecipeCard recipe={m.recipe} />}
              </li>
            ))}
            {loading && (
              <li className="flex justify-start">
                <div className="rounded-2xl border border-arena-border bg-arena-surface px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-arena-muted" />
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-arena-border bg-background px-3 py-2">
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Effacer"
            className="rounded-full p-2 text-arena-muted active:scale-90"
          >
            <Trash2 size={16} />
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Demande au Coach…"
          className="h-11 flex-1 rounded-xl border border-arena-border bg-arena-surface px-3 text-sm text-foreground outline-none placeholder:text-arena-muted"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-arena text-arena-on disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}

function WorkoutCard({
  workout,
  starting,
  onStart,
}: {
  workout: GeneratedWorkout;
  starting: boolean;
  onStart: () => void;
}) {
  return (
    <div className="w-full max-w-[95%] rounded-2xl border border-arena-border bg-arena-surface p-3">
      <div className="mb-2">
        <h4 className="text-sm font-black text-foreground">{workout.name}</h4>
        <p className="text-[11px] text-arena-muted">
          {workout.focus} · {workout.duration_min} min · {workout.muscle_groups.join(", ")}
        </p>
      </div>

      {workout.warmup && (
        <div className="mb-2 rounded-lg border border-arena-border bg-background p-2">
          <p className="mb-0.5 text-[9px] font-black tracking-widest text-arena-muted">ÉCHAUFFEMENT</p>
          <p className="text-[11px] text-foreground">{workout.warmup}</p>
        </div>
      )}

      <ul className="mb-2 flex flex-col gap-1.5">
        {workout.exercises.map((e, i) => (
          <li key={i} className="rounded-lg border border-arena-border bg-background p-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-black text-foreground">
                {i + 1}. {e.name}
              </span>
              <span className="whitespace-nowrap text-[11px] font-black text-arena">
                {e.sets} × {e.reps}
                {typeof e.suggested_weight_kg === "number" ? ` · ${e.suggested_weight_kg}kg` : ""}
              </span>
            </div>
            <p className="text-[10px] text-arena-muted">
              Repos {e.rest_s}s · {e.muscle_groups.join(", ")}
            </p>
            {e.notes && <p className="mt-0.5 text-[10px] text-arena-sub">{e.notes}</p>}
          </li>
        ))}
      </ul>

      {workout.cooldown && (
        <div className="mb-2 rounded-lg border border-arena-border bg-background p-2">
          <p className="mb-0.5 text-[9px] font-black tracking-widest text-arena-muted">RETOUR AU CALME</p>
          <p className="text-[11px] text-foreground">{workout.cooldown}</p>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={starting}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-arena text-xs font-black tracking-widest text-arena-on disabled:opacity-50"
      >
        {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        DÉMARRER CETTE SÉANCE
      </button>
    </div>
  );
}
