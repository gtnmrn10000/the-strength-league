import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, Dumbbell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import {
  coachChat,
  coachClearHistory,
  coachHistory,
  coachSaveWorkoutSession,
  type ChatMsg,
  type GeneratedWorkout,
} from "@/lib/api";

const SUGGESTIONS = [
  "Aide-moi à préparer ma séance du jour",
  "Comment progresser au développé couché ?",
  "Quels muscles dois-je laisser récupérer ?",
];

function coachError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) return "Trop de demandes. Réessaie dans un instant.";
  if (message.includes("402") || message.includes("PREMIUM_REQUIRED")) return "Le Coach est réservé aux membres Premium.";
  if (message.includes("401") || message.toLowerCase().includes("unauthorized")) return "Ta session a expiré. Reconnecte-toi.";
  return "Le Coach est momentanément indisponible.";
}

export default function CoachChat({ onSessionStarted }: { onSessionStarted?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [draft, setDraft] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);

  useEffect(() => {
    let active = true;
    void coachHistory()
      .then((history) => active && setMessages(Array.isArray(history) ? history : []))
      .catch((error) => active && toast.error(coachError(error)))
      .finally(() => active && setBooting(false));
    return () => { active = false; };
  }, []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setMessages((current) => [...current, { role: "user", content, at: new Date().toISOString() }]);
    setDraft("");
    setLoading(true);
    try {
      const answer = await coachChat(content);
      setMessages((current) => [...current, {
        role: "assistant",
        content: answer.reply,
        workout: answer.workout ?? null,
        recipe: answer.recipe ?? null,
        warnings: answer.warnings ?? [],
        at: new Date().toISOString(),
      }]);
    } catch (error) {
      setMessages((current) => current.slice(0, -1));
      toast.error(coachError(error));
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    if (!window.confirm("Effacer l’historique du Coach ?")) return;
    try {
      await coachClearHistory();
      setMessages([]);
    } catch (error) {
      toast.error(coachError(error));
    }
  };

  const saveWorkout = async (workout: GeneratedWorkout, mode: "start" | "schedule") => {
    setSavingWorkout(true);
    try {
      await coachSaveWorkoutSession({
        name: workout.name,
        duration_min: workout.duration_min,
        muscle_groups: workout.muscle_groups,
        exercises: workout.exercises,
        mode,
        scheduled_for: mode === "schedule" ? workout.scheduled_for : null,
      });
      toast.success(mode === "start" ? "Séance ajoutée à ton entraînement." : "Séance programmée.");
      onSessionStarted?.();
    } catch (error) {
      toast.error(coachError(error));
    } finally {
      setSavingWorkout(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation>
          <ConversationContent className="gap-5 px-4 py-5">
            {booting ? (
              <Shimmer className="mx-auto text-sm" duration={1.6}>Chargement de la conversation…</Shimmer>
            ) : messages.length === 0 ? (
              <ConversationEmptyState className="justify-start px-0 pt-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-arena-border bg-arena-surface">
                  <Dumbbell className="text-arena" size={25} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Ton Coach</h3>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-arena-sub">
                    Parle entraînement, technique ou récupération. Ses réponses utilisent ton historique réel.
                  </p>
                </div>
                <div className="mt-3 flex w-full flex-col gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <Button key={suggestion} variant="outline" className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-xs" onClick={() => void send(suggestion)}>
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : messages.map((message, index) => (
              <Message key={`${message.at ?? index}-${index}`} from={message.role}>
                <MessageContent className={message.role === "user" ? "bg-primary text-primary-foreground" : "w-full"}>
                  {message.role === "assistant" ? <MessageResponse>{message.content}</MessageResponse> : <p className="whitespace-pre-wrap">{message.content}</p>}
                </MessageContent>
                {message.role === "assistant" && message.warnings?.map((warning) => (
                  <div key={warning} className="flex max-w-full items-start gap-2 border-l-2 border-arena-gold px-3 py-1 text-xs text-arena-sub">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-arena-gold" /> {warning}
                  </div>
                ))}
                {message.role === "assistant" && message.workout && (
                  <WorkoutSuggestion workout={message.workout} busy={savingWorkout} onSave={saveWorkout} />
                )}
              </Message>
            ))}
            {loading && <Shimmer className="text-sm" duration={1.4}>Le Coach prépare sa réponse…</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="border-t border-arena-border bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <PromptInput onSubmit={({ text }) => void send(text)} className="border-arena-border bg-arena-surface">
          <PromptInputTextarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écris au Coach…" disabled={loading} className="min-h-12 max-h-28" />
          <PromptInputFooter className="justify-between">
            <Button type="button" variant="ghost" size="icon-sm" onClick={clear} disabled={messages.length === 0 || loading} aria-label="Effacer l’historique">
              <Trash2 size={16} />
            </Button>
            <PromptInputSubmit status={loading ? "submitted" : "ready"} disabled={!draft.trim() || loading} className="bg-primary text-primary-foreground" />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function WorkoutSuggestion({ workout, busy, onSave }: { workout: GeneratedWorkout; busy: boolean; onSave: (workout: GeneratedWorkout, mode: "start" | "schedule") => void }) {
  return (
    <div className="w-full border border-arena-border bg-arena-surface p-3">
      <h4 className="text-sm font-semibold text-foreground">{workout.name}</h4>
      <p className="mt-1 text-xs text-arena-sub">{workout.duration_min} min · {workout.muscle_groups.join(", ")}</p>
      <ol className="mt-3 space-y-1 text-xs text-foreground">
        {workout.exercises.slice(0, 8).map((exercise, index) => <li key={`${exercise.name}-${index}`}>{index + 1}. {exercise.name} · {exercise.sets} × {exercise.reps}</li>)}
      </ol>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button disabled={busy} size="sm" onClick={() => onSave(workout, "start")}><Dumbbell size={14} /> Ajouter</Button>
        <Button disabled={busy || !workout.scheduled_for} variant="outline" size="sm" onClick={() => onSave(workout, "schedule")}><CalendarClock size={14} /> Programmer</Button>
      </div>
    </div>
  );
}