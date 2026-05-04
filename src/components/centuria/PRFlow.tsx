import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FolderOpen, Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitPR, mockVerifyPR } from "@/server/prs.functions";
import {
  GRADE_LABELS,
  GRADE_EMOJIS,
  computeGradeForLift,
  type Grade,
} from "@/lib/grades";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

type Exercise = "squat" | "bench" | "deadlift";
type Step = 1 | 2 | 3 | 4 | "uploading" | "victory";

interface VerifyResult {
  previousGrade: Grade;
  newGrade: Grade;
  xp: number;
  leveledUp: boolean;
}

const EXERCISES: { id: Exercise; emoji: string; label: string }[] = [
  { id: "squat", emoji: "🦵", label: "SQUAT" },
  { id: "bench", emoji: "💪", label: "BENCH PRESS" },
  { id: "deadlift", emoji: "🔴", label: "DEADLIFT" },
];

const ANALYSIS_TEXTS = [
  "Analyse de la profondeur...",
  "Vérification des charges...",
  "Contrôle de la forme...",
  "Calcul du ratio BW...",
  "Validation finale...",
];

const pageVariants = {
  initial: { opacity: 0, x: 80 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -80, transition: { duration: 0.25 } },
};

/* ─── Confetti ─── */
function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 2,
        size: 4 + Math.random() * 6,
        color: ["#DC2626", "#EAB308", "#F97316", "#FBBF24", "#EF4444"][
          Math.floor(Math.random() * 5)
        ],
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: 360 + Math.random() * 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.size > 7 ? "2px" : "50%",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Pulsing loader ─── */
function PulsingLoader() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-arena"
          style={{ width: 40 + i * 30, height: 40 + i * 30 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.div
        className="h-4 w-4 rounded-full bg-arena"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function PRFlow({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean, prValidated?: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [analysisIdx, setAnalysisIdx] = useState(0);
  const [userBW, setUserBW] = useState<number>(80);
  const weightRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canContinueStep2 = weight !== "" && Number(weight) >= 20 && Number(weight) <= 500;
  const videoValid = videoFile && !error;

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setExercise(null);
      setWeight("");
      setReps(1);
      setVideoFile(null);
      setVideoUrl(null);
      setVideoDuration(null);
      setError(null);
      setUploadProgress(0);
      setVerifyResult(null);
      setAnalysisIdx(0);
    }
  }, [open]);

  // Load user BW
  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("poids")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.poids) setUserBW(Number(data.poids));
        });
    });
  }, [open]);

  // Auto-focus weight input
  useEffect(() => {
    if (step === 2 && weightRef.current) {
      weightRef.current.focus();
    }
  }, [step]);

  // Rotate analysis text
  useEffect(() => {
    if (step !== "uploading" || uploadProgress < 60) return;
    const iv = setInterval(() => {
      setAnalysisIdx((p) => (p + 1) % ANALYSIS_TEXTS.length);
    }, 1000);
    return () => clearInterval(iv);
  }, [step, uploadProgress]);

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

  const handleVideoLoaded = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const dur = e.currentTarget.duration;
      setVideoDuration(dur);
      if (dur < 5 || dur > 90) {
        setError("La vidéo doit durer entre 5 et 90 secondes");
      } else {
        setError(null);
      }
    },
    []
  );

  const clearVideo = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(null);
    setError(null);
  }, [videoUrl]);

  const ratio = weight ? (Number(weight) / userBW).toFixed(2) : null;
  const gradeVise =
    exercise && weight
      ? computeGradeForLift(exercise, Number(weight), userBW)
      : null;

  /* ─── SUBMIT ─── */
  const handleSubmit = async () => {
    if (!exercise || !videoFile) return;
    setStep("uploading");
    setUploadProgress(0);
    setAnalysisIdx(0);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const ext = videoFile.name.split(".").pop() || "mp4";
      const path = `${user.id}/${exercise}/${Date.now()}.${ext}`;

      setUploadProgress(20);
      const { error: uploadErr } = await supabase.storage
        .from("pr-videos")
        .upload(path, videoFile, { contentType: videoFile.type });
      if (uploadErr) throw uploadErr;

      setUploadProgress(50);
      const { data: urlData } = supabase.storage
        .from("pr-videos")
        .getPublicUrl(path);

      setUploadProgress(70);
      const pr = await submitPR({
        data: {
          exercise,
          weight_kg: Number(weight),
          reps,
          video_url: urlData.publicUrl,
        },
      });

      setUploadProgress(85);
      await new Promise((r) => setTimeout(r, 5000));
      const result = await mockVerifyPR({ data: { prId: pr.id } });
      setVerifyResult(result);

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

  const handleClose = (prValidated?: boolean) => {
    onOpenChange(false, prValidated);
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose(step === "victory");
      }}
    >
      <SheetContent
        side="bottom"
        className="flex h-dvh flex-col border-none bg-[#0A0A0A] p-0 [&>button]:hidden"
      >
        {/* Accessible title (visually hidden) */}
        <SheetTitle className="sr-only">Log un PR</SheetTitle>

        {/* Header with progress bar */}
        {typeof step === "number" && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            {step > 1 ? (
              <button onClick={goBack} className="p-2 text-arena-sub">
                <ChevronLeft size={24} />
              </button>
            ) : (
              <div className="w-10" />
            )}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-arena shadow-[0_0_8px_var(--arena-glow)]" : "bg-[#262626]"
                  }`}
                />
              ))}
            </div>
            <button onClick={() => handleClose()} className="p-2 text-arena-sub">
              ✕
            </button>
          </div>
        )}

        {/* Close for non-step views */}
        {typeof step !== "number" && (
          <div className="flex justify-end px-4 pt-4">
            <button onClick={() => handleClose(step === "victory")} className="p-2 text-arena-sub">
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <AnimatePresence mode="wait">
            {/* ═══ STEP 1 — Exercise ═══ */}
            {step === 1 && (
              <motion.div key="s1" {...pageVariants} className="flex flex-col gap-4 pt-6">
                <h2 className="text-center font-[Anton] text-[32px] uppercase tracking-wide text-foreground">
                  QUEL EXERCICE ?
                </h2>
                <p className="text-center text-sm text-arena-sub">
                  Choisis l'exercice de ton 1RM
                </p>
                <div className="mt-4 flex flex-col gap-4">
                  {EXERCISES.map((ex) => (
                    <motion.button
                      key={ex.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setExercise(ex.id);
                        setStep(2);
                      }}
                      className="flex h-[100px] items-center gap-5 rounded-2xl border border-[#262626] bg-[#141414] px-6 text-left transition-all hover:border-arena hover:shadow-[0_0_15px_var(--arena-glow)]"
                    >
                      <span className="text-5xl">{ex.emoji}</span>
                      <span className="font-[Anton] text-xl uppercase tracking-widest text-foreground">
                        {ex.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2 — Weight ═══ */}
            {step === 2 && (
              <motion.div key="s2" {...pageVariants} className="flex flex-col gap-4 pt-6">
                <h2 className="text-center font-[Anton] text-[32px] uppercase tracking-wide text-foreground">
                  COMBIEN ?
                </h2>
                <p className="text-center text-sm text-arena-sub">
                  Ton 1RM (1 répétition maximale)
                </p>

                <div className="mt-8 flex items-baseline justify-center gap-3">
                  <input
                    ref={weightRef}
                    type="number"
                    inputMode="numeric"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0"
                    className="h-[80px] w-44 rounded-2xl border border-[#262626] bg-[#141414] text-center font-[Anton] text-[64px] leading-none text-foreground outline-none transition-colors focus:border-arena"
                  />
                  <span className="font-[Anton] text-2xl text-arena-muted">kg</span>
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-arena-muted">
                    Répétitions
                  </p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <motion.button
                        key={r}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setReps(r)}
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          reps === r
                            ? "bg-arena text-arena-foreground shadow-[0_0_12px_var(--arena-glow)]"
                            : "border border-[#262626] bg-[#141414] text-arena-sub"
                        }`}
                      >
                        {r}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#262626] font-bold text-arena-sub"
                  >
                    <ChevronLeft size={16} /> Retour
                  </button>
                  <button
                    disabled={!canContinueStep2}
                    onClick={() => setStep(3)}
                    className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] transition-opacity disabled:opacity-40 disabled:shadow-none"
                  >
                    Continuer <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 3 — Video ═══ */}
            {step === 3 && (
              <motion.div key="s3" {...pageVariants} className="flex flex-col gap-4 pt-6">
                <h2 className="text-center font-[Anton] text-[32px] uppercase tracking-wide text-foreground">
                  FILME TA TENTATIVE
                </h2>

                <div className="mt-4 rounded-2xl border border-arena/30 bg-[#1A0F0F] p-4 text-sm">
                  <p className="mb-2 flex items-center gap-2 font-bold text-foreground">
                    <span>⚠️</span> RÈGLES OBLIGATOIRES
                  </p>
                  {[
                    "Plan large (corps entier visible)",
                    "Charges visibles (plaques nettes)",
                    "Une seule prise (pas de coupe)",
                    "Durée 15 à 60 secondes",
                  ].map((r, i) => (
                    <p key={i} className="flex items-start gap-2 py-0.5 text-arena-sub">
                      <Check size={14} className="mt-0.5 shrink-0 text-arena-green" /> {r}
                    </p>
                  ))}
                  <p className="mt-2 flex items-start gap-2 text-yellow-500 text-xs">
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
                      whileTap={{ scale: 0.98 }}
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-arena font-[Anton] text-lg uppercase tracking-wider text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
                    >
                      📹 FILMER MAINTENANT
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => videoInputRef.current?.click()}
                      className="flex h-16 items-center justify-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] font-[Anton] text-lg uppercase tracking-wider text-arena-sub"
                    >
                      📁 CHOISIR UNE VIDÉO
                    </motion.button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <video
                      src={videoUrl!}
                      controls
                      className="w-full rounded-2xl border border-[#262626]"
                      onLoadedMetadata={handleVideoLoaded}
                    />
                    <div className="flex justify-between text-xs text-arena-sub">
                      <span>
                        Durée : {videoDuration ? `${Math.round(videoDuration)}s` : "..."}
                      </span>
                      <span>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    {error && <p className="text-sm font-bold text-red-500">{error}</p>}
                    <button
                      onClick={clearVideo}
                      className="flex items-center justify-center gap-1 text-sm text-arena-sub"
                    >
                      <RotateCcw size={14} /> Choisir une autre vidéo
                    </button>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#262626] font-bold text-arena-sub"
                  >
                    <ChevronLeft size={16} /> Retour
                  </button>
                  <button
                    disabled={!videoValid}
                    onClick={() => setStep(4)}
                    className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)] disabled:opacity-40 disabled:shadow-none"
                  >
                    Continuer <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 4 — Confirm ═══ */}
            {step === 4 && (
              <motion.div key="s4" {...pageVariants} className="flex flex-col gap-4 pt-6">
                <h2 className="text-center font-[Anton] text-[32px] uppercase tracking-wide text-foreground">
                  PRÊT À VALIDER ?
                </h2>

                <div className="mt-4 rounded-2xl border border-[#262626] bg-[#141414] p-5">
                  <Row label="Exercice">
                    <span className="flex items-center gap-2 font-bold uppercase text-foreground">
                      {EXERCISES.find((e) => e.id === exercise)?.emoji}{" "}
                      {EXERCISES.find((e) => e.id === exercise)?.label}
                    </span>
                  </Row>
                  <Row label="Charge" border>
                    <span className="font-[Anton] text-xl text-arena">
                      {weight} kg{" "}
                      <span className="text-sm font-normal text-arena-sub">
                        × {reps} rep{reps > 1 ? "s" : ""}
                      </span>
                    </span>
                  </Row>
                  <Row label="Vidéo" border>
                    <span className="max-w-[180px] truncate font-bold text-foreground">
                      {videoFile?.name}{" "}
                      <span className="text-xs text-arena-muted">
                        ({videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) : 0} MB)
                      </span>
                    </span>
                  </Row>
                  <Row label="Ratio estimé" border>
                    <span className="font-bold text-foreground">{ratio}× BW</span>
                  </Row>
                  <Row label="Grade visé" border>
                    <span className="font-bold text-arena-gold">
                      {gradeVise && GRADE_EMOJIS[gradeVise]}{" "}
                      {gradeVise && GRADE_LABELS[gradeVise]}
                    </span>
                  </Row>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  className="mt-6 h-16 w-full rounded-2xl bg-gradient-to-r from-arena to-[#B91C1C] font-[Anton] text-2xl uppercase tracking-wider text-arena-foreground shadow-[0_0_30px_var(--arena-glow)]"
                >
                  🔥 VALIDER MON PR
                </motion.button>
              </motion.div>
            )}

            {/* ═══ UPLOADING ═══ */}
            {step === "uploading" && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-8 pt-20"
              >
                <PulsingLoader />

                <div className="flex flex-col items-center gap-2">
                  <p className="font-[Anton] text-xl uppercase tracking-wider text-foreground">
                    {uploadProgress < 60
                      ? "UPLOAD EN COURS..."
                      : "VÉRIFICATION IA EN COURS..."}
                  </p>
                  {uploadProgress >= 60 && (
                    <motion.p
                      key={analysisIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-sm text-arena-sub"
                    >
                      {ANALYSIS_TEXTS[analysisIdx]}
                    </motion.p>
                  )}
                </div>

                <div className="h-2 w-52 overflow-hidden rounded-full bg-[#262626]">
                  <motion.div
                    className="h-full bg-arena"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}

            {/* ═══ VICTORY ═══ */}
            {step === "victory" && (
              <motion.div
                key="victory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex flex-1 flex-col items-center justify-center gap-6 pt-10"
              >
                <Confetti />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-arena/10" />

                <motion.div
                  initial={{ rotateY: 180, opacity: 0, scale: 0.7 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, type: "spring", damping: 12 }}
                  className="relative z-10"
                  style={{ perspective: 1000 }}
                >
                  <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-arena-gold bg-gradient-to-br from-[#1a1400] to-[#141414] px-10 py-8 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(234,179,8,0.3)",
                          "0 0 40px rgba(234,179,8,0.5)",
                          "0 0 20px rgba(234,179,8,0.3)",
                        ],
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex h-20 w-20 items-center justify-center rounded-2xl bg-arena-gold/10"
                    >
                      <span className="text-5xl">✅</span>
                    </motion.div>

                    <h2 className="font-[Anton] text-3xl uppercase tracking-wider text-foreground">
                      PR VÉRIFIÉ
                    </h2>

                    <p className="text-sm text-arena-sub">
                      {EXERCISES.find((e) => e.id === exercise)?.emoji}{" "}
                      {EXERCISES.find((e) => e.id === exercise)?.label} — {weight} kg × {reps} rep
                      {reps > 1 ? "s" : ""}
                    </p>

                    {ratio && (
                      <p className="text-sm text-arena-sub">Ratio : {ratio}× BW</p>
                    )}
                  </div>
                </motion.div>

                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: -10, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="relative z-10 font-[Anton] text-3xl text-arena-gold"
                >
                  +500 XP
                </motion.p>

                {verifyResult && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="relative z-10 text-sm text-arena-sub"
                  >
                    Total : {verifyResult.xp} XP
                  </motion.p>
                )}

                {verifyResult?.leveledUp && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring", damping: 8 }}
                    className="relative z-10 flex flex-col items-center gap-2 rounded-2xl border-2 border-arena-gold bg-arena-gold/10 px-10 py-5"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: 3, duration: 0.5, delay: 1.3 }}
                      className="text-5xl"
                    >
                      {GRADE_EMOJIS[verifyResult.newGrade]}
                    </motion.span>
                    <p className="font-[Anton] text-xl uppercase tracking-wider text-arena-gold">
                      LEVEL UP !
                    </p>
                    <p className="text-sm text-foreground">
                      {GRADE_LABELS[verifyResult.previousGrade]} →{" "}
                      {GRADE_LABELS[verifyResult.newGrade]}
                    </p>
                  </motion.div>
                )}

                {verifyResult && !verifyResult.leveledUp && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="relative z-10 text-sm text-arena-sub"
                  >
                    {GRADE_EMOJIS[verifyResult.newGrade]} Grade :{" "}
                    {GRADE_LABELS[verifyResult.newGrade]}
                  </motion.p>
                )}

                <div className="relative z-10 mt-4 flex w-full flex-col gap-3">
                  <button
                    onClick={() => handleClose(true)}
                    className="h-12 w-full rounded-2xl border border-[#262626] text-sm font-bold text-arena-sub"
                  >
                    Voir mon profil
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleClose(true)}
                    className="h-14 w-full rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
                  >
                    Partager sur le feed
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Helper ─── */
function Row({
  label,
  border,
  children,
}: {
  label: string;
  border?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 text-sm ${
        border ? "border-t border-[#262626]" : ""
      }`}
    >
      <span className="text-arena-sub">{label}</span>
      {children}
    </div>
  );
}
