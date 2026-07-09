import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { coachChat, getCoachHistory, clearCoachHistory, type ChatMsg } from "@/lib/coach.functions";

export default function CoachChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await coachChat({ data: { message: text } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
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

  const clear = async () => {
    if (!confirm("Effacer tout l'historique du Coach ?")) return;
    try {
      await clearCoachHistory();
      setMessages([]);
    } catch {
      toast.error("Suppression impossible.");
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
              Pose ta question au Coach IA : programmation, technique, récup, nutrition. Il connaît ton profil et tes dernières séances.
            </p>
            <div className="mt-3 flex flex-col gap-2 text-left text-xs">
              {[
                "Génère-moi un split 4j/semaine",
                "Comment progresser au bench ?",
                "Combien de repos entre 2 séances jambes ?",
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
              <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-arena text-arena-on"
                      : "border border-arena-border bg-arena-surface text-foreground"
                  }`}
                >
                  {m.content}
                </div>
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
