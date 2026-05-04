import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, FolderOpen, Check, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitPR, mockVerifyPR } from "@/server/prs.functions";

type Exercise = "squat" | "bench" | "deadlift";
type Step = 1 | 2 | 3 | 4 | "uploading" | "victory";

const EXERCISES: { id: Exercise; emoji: string; label: string }[] = [
  { id: "squat", emoji: "🦵", label: "SQUAT" },
  { id: "bench", emoji: "💪", label: "BENCH PRESS" },
  { id: "deadlift", emoji: "🔴", label: "DEADLIFT" },
];

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2 } },
};

export default function PRFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const weightRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canContinueStep2 = weight !== "" && Number(weight) >= 20 && Number(weight) <= 500;

  useEffect(() => {
    if (step === 2 && weightRef.current) {
      weightRef.current.focus();
    }
  }, [step]);

  const handleVideoSelect = useCallback((file: File) => {
    setError(null);
    if (file.size > 100 * 1024 * 1024) {
      setError("La vidéo ne doit pas dépasser 100 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
  }, []);

  const handleVideoLoaded = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    setVideoDuration(dur);
    if (dur < 5 || dur > 90) {
      setError("La vidéo doit durer entre 5 et 90 secondes");
    }
  }, []);

  const handleSubmit = async () => {
    if (!exercise || !videoFile) return;
    setStep("uploading");
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const ext = videoFile.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;

      setUploadProgress(20);
      const { error: uploadErr } = await supabase.storage
        .from("pr-videos")
        .upload(path, videoFile, { contentType: videoFile.type });
      if (uploadErr) throw uploadErr;

      setUploadProgress(60);
      const { data: urlData } = supabase.storage.from("pr-videos").getPublicUrl(path);

      setUploadProgress(80);
      const pr = await submitPR({
        data: {
          exercise,
          weight_kg: Number(weight),
          reps,
          video_url: urlData.publicUrl,
        },
      });

      setUploadProgress(90);

      // Mock AI verification — 3 second delay
      await new Promise((r) => setTimeout(r, 3000));
      await mockVerifyPR({ data: { prId: pr.id } });

      setUploadProgress(100);
      setStep("victory");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      setStep(4);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {typeof step === "number" && step > 1 ? (
          <button onClick={goBack} className="p-2 text-arena-sub">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="w-10" />
        )}
        {typeof step === "number" && (
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 w-8 rounded-full transition-colors ${s <= step ? "bg-arena" : "bg-arena-border"}`}
              />
            ))}
          </div>
        )}
        <button onClick={onClose} className="p-2 text-arena-sub">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" {...pageVariants} className="flex flex-col gap-4 pt-6">
              <h2 className="text-center font-[Anton] text-2xl uppercase tracking-wide text-foreground">
                Quel exercice ?
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {EXERCISES.map((ex) => (
                  <motion.button
                    key={ex.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setExercise(ex.id);
                      setStep(2);
                    }}
                    className="flex items-center gap-4 rounded-2xl border border-arena-border bg-arena-surface p-6 text-left transition-colors active:bg-arena-border"
                  >
                    <span className="text-4xl">{ex.emoji}</span>
                    <span className="font-[Anton] text-xl uppercase tracking-wider text-foreground">
                      {ex.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" {...pageVariants} className="flex flex-col gap-4 pt-6">
              <h2 className="text-center font-[Anton] text-2xl uppercase tracking-wide text-foreground">
                Combien de kilos ?
              </h2>
              <p className="text-center text-sm text-arena-sub">
                Ton 1RM (1 répétition maximale)
              </p>

              <div className="mt-6 flex items-center justify-center gap-2">
                <input
                  ref={weightRef}
                  type="number"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="h-[60px] w-40 rounded-2xl border border-arena-border bg-arena-surface text-center font-[Anton] text-4xl text-foreground outline-none focus:border-arena"
                />
                <span className="font-[Anton] text-2xl text-arena-sub">kg</span>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-center text-xs text-arena-sub">Nombre de reps</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReps(r)}
                      className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${
                        reps === r
                          ? "bg-arena text-arena-foreground"
                          : "border border-arena-border bg-arena-surface text-arena-sub"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!canContinueStep2}
                onClick={() => setStep(3)}
                className="mt-8 h-14 w-full rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] transition-opacity disabled:opacity-40 disabled:shadow-none"
              >
                Continuer
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" {...pageVariants} className="flex flex-col gap-4 pt-6">
              <h2 className="text-center font-[Anton] text-2xl uppercase tracking-wide text-foreground">
                Filme ta tentative
              </h2>

              <div className="mt-4 rounded-2xl border border-arena-border bg-arena-surface p-4 text-sm">
                <p className="mb-2 font-bold text-foreground">Règles obligatoires :</p>
                {[
                  "Plan large (corps entier visible)",
                  "Charges visibles (plaques nettes)",
                  "Une seule prise (pas de coupe)",
                  "15 à 60 secondes",
                ].map((r, i) => (
                  <p key={i} className="flex items-start gap-2 py-0.5 text-arena-sub">
                    <Check size={14} className="mt-0.5 text-arena-green shrink-0" /> {r}
                  </p>
                ))}
                <p className="mt-2 flex items-start gap-2 text-yellow-500">
                  <span>⚠️</span> Triche détectée = ban définitif
                </p>
              </div>

              {!videoFile ? (
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleVideoSelect(f);
                    }}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleVideoSelect(f);
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
                  >
                    <Camera size={18} /> Filmer maintenant
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => videoInputRef.current?.click()}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-arena-border bg-arena-surface font-bold text-arena-sub"
                  >
                    <FolderOpen size={18} /> Choisir une vidéo
                  </motion.button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  <video
                    src={videoUrl!}
                    controls
                    className="w-full rounded-2xl border border-arena-border"
                    onLoadedMetadata={handleVideoLoaded}
                  />
                  <div className="flex justify-between text-xs text-arena-sub">
                    <span>
                      Durée : {videoDuration ? `${Math.round(videoDuration)}s` : "..."}
                    </span>
                    <span>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                  <button
                    onClick={() => {
                      setVideoFile(null);
                      setVideoUrl(null);
                      setVideoDuration(null);
                      setError(null);
                    }}
                    className="text-sm text-arena-sub underline"
                  >
                    Changer de vidéo
                  </button>
                  <button
                    disabled={!!error}
                    onClick={() => setStep(4)}
                    className="h-14 w-full rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] disabled:opacity-40 disabled:shadow-none"
                  >
                    Continuer
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" {...pageVariants} className="flex flex-col gap-4 pt-6">
              <h2 className="text-center font-[Anton] text-2xl uppercase tracking-wide text-foreground">
                Prêt à valider ton PR ?
              </h2>

              <div className="mt-4 rounded-2xl border border-arena-border bg-arena-surface p-5">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-arena-sub">Exercice</span>
                  <span className="font-bold uppercase text-foreground">
                    {EXERCISES.find((e) => e.id === exercise)?.label}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm border-t border-arena-border">
                  <span className="text-arena-sub">Poids</span>
                  <span className="font-bold text-foreground">
                    {weight} kg × {reps} rep{reps > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm border-t border-arena-border">
                  <span className="text-arena-sub">Vidéo</span>
                  <span className="font-bold text-foreground truncate max-w-[180px]">
                    {videoFile?.name}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="mt-6 h-16 w-full rounded-2xl bg-arena font-[Anton] text-xl uppercase tracking-wider text-arena-foreground shadow-[0_0_30px_var(--arena-glow)]"
              >
                🔥 VALIDER MON PR
              </motion.button>
            </motion.div>
          )}

          {step === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-6 pt-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-16 w-16 rounded-full border-4 border-arena-border border-t-arena"
              />
              <p className="font-[Anton] text-lg uppercase tracking-wide text-foreground">
                {uploadProgress < 60
                  ? "Upload en cours..."
                  : "Vérification IA en cours..."}
              </p>
              <div className="h-2 w-48 overflow-hidden rounded-full bg-arena-border">
                <motion.div
                  className="h-full bg-arena"
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}

          {step === "victory" && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="flex flex-1 flex-col items-center justify-center gap-6 pt-16"
            >
              <motion.div
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-arena-gold bg-gradient-to-br from-arena-gold/20 to-transparent"
              >
                <span className="text-5xl">✅</span>
              </motion.div>

              <h2 className="font-[Anton] text-3xl uppercase tracking-wider text-foreground">
                PR VÉRIFIÉ !
              </h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: -10, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="font-[Anton] text-2xl text-arena-gold"
              >
                +500 XP
              </motion.p>

              <p className="text-sm text-arena-sub">
                {EXERCISES.find((e) => e.id === exercise)?.label} — {weight} kg × {reps} rep
                {reps > 1 ? "s" : ""}
              </p>

              <div className="mt-6 flex w-full flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="h-14 w-full rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
                >
                  Voir mon profil
                </motion.button>
                <button
                  onClick={onClose}
                  className="h-12 w-full rounded-2xl border border-arena-border text-sm font-bold text-arena-sub"
                >
                  Partager sur le feed
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
