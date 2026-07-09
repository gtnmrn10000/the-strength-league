import { useState } from "react";
import { Loader2, Sparkles, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateWorkout, saveWorkoutSession, type GeneratedWorkout } from "@/lib/coach.functions";

const PRESET_FOCUS = ["Push", "Pull", "Jambes", "Full body", "Upper", "Lower"];

export default function CoachWorkout({ onSaved }: { onSaved?: () => void }) {
  const [focus, setFocus] = useState("Push");
  const [duration, setDuration] = useState(60);
  const [equipment, setEquipment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const w = await generateWorkout({
        data: { focus, duration_min: duration, equipment: equipment.trim() || undefined },
      });
      setWorkout(w);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("PREMIUM_REQUIRED") || msg.includes("402")) toast.error("Réservé aux abonnés Premium.");
      else if (msg.includes("429")) toast.error("Trop de requêtes.");
      else toast.error("Génération impossible.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!workout) return;
    setSaving(true);
    try {
      await saveWorkoutSession({
        data: {
          name: workout.name,
          duration_min: workout.duration_min,
          muscle_groups: workout.muscle_groups,
          exercises: workout.exercises,
        },
      });
      toast.success("Séance loggée ✅");
      onSaved?.();
      setWorkout(null);
    } catch {
      toast.error("Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-3">
      {!workout ? (
        <>
          <p className="mb-3 text-xs text-arena-muted">
            Le Coach compose une séance à partir de ton profil et de ta récup courante.
          </p>

          <label className="mb-1 text-[11px] font-black tracking-widest text-arena-muted">FOCUS</label>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {PRESET_FOCUS.map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={`rounded-xl border p-2 text-xs font-bold ${
                  focus === f ? "border-arena bg-arena text-arena-on" : "border-arena-border bg-arena-surface text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <label className="mb-1 text-[11px] font-black tracking-widest text-arena-muted">DURÉE : {duration} min</label>
          <input
            type="range"
            min={20}
            max={120}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mb-3 w-full accent-arena"
          />

          <label className="mb-1 text-[11px] font-black tracking-widest text-arena-muted">MATÉRIEL (optionnel)</label>
          <input
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="ex : haltères + rack, à la maison…"
            className="mb-4 h-11 rounded-xl border border-arena-border bg-arena-surface px-3 text-sm text-foreground outline-none placeholder:text-arena-muted"
          />

          <button
            onClick={generate}
            disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-arena text-sm font-black text-arena-on disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Générer ma séance
          </button>
        </>
      ) : (
        <>
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-black text-foreground">{workout.name}</h3>
              <p className="text-xs text-arena-muted">
                {workout.focus} · {workout.duration_min} min · {workout.muscle_groups.join(", ")}
              </p>
            </div>
            <button
              onClick={() => setWorkout(null)}
              className="rounded-full border border-arena-border p-2 text-arena-muted active:scale-90"
              aria-label="Régénérer"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {workout.warmup && (
            <div className="mb-3 rounded-xl border border-arena-border bg-arena-surface p-3">
              <p className="mb-1 text-[10px] font-black tracking-widest text-arena-muted">ÉCHAUFFEMENT</p>
              <p className="text-xs text-foreground">{workout.warmup}</p>
            </div>
          )}

          <ul className="mb-3 flex flex-col gap-2">
            {workout.exercises.map((e, i) => (
              <li key={i} className="rounded-2xl border border-arena-border bg-arena-surface p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-black text-foreground">
                    {i + 1}. {e.name}
                  </span>
                  <span className="text-xs font-black text-arena">
                    {e.sets} × {e.reps}
                  </span>
                </div>
                <p className="text-[11px] text-arena-muted">
                  Repos {e.rest_s}s · {e.muscle_groups.join(", ")}
                </p>
                {e.notes && <p className="mt-1 text-[11px] text-arena-sub">{e.notes}</p>}
              </li>
            ))}
          </ul>

          {workout.cooldown && (
            <div className="mb-4 rounded-xl border border-arena-border bg-arena-surface p-3">
              <p className="mb-1 text-[10px] font-black tracking-widest text-arena-muted">RETOUR AU CALME</p>
              <p className="text-xs text-foreground">{workout.cooldown}</p>
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-arena text-sm font-black text-arena-on disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Logger comme faite
          </button>
        </>
      )}
    </div>
  );
}
