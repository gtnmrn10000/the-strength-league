import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Dumbbell,
  Search,
  Video,
  FolderOpen,
} from "lucide-react";
import {
  EXERCISE_LIBRARY,
  searchExercises,
  type LibraryExercise,
} from "@/lib/exerciseCatalog";
import { supabase } from "@/integrations/supabase/client";
import { submitPR } from "@/lib/api";
import { captureVideo } from "@/lib/nativeMedia";
import {
  GRADE_LABELS,
  computeGradeForLift,
} from "@/lib/grades";
import { GradeIcon } from "@/lib/gradeIcons";
import { track } from "@/lib/analytics";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

type Step = 1 | 2 | 3 | 4 | "uploading" | "victory";

/** Les trois lifts historiques ouvrent en plus un badge de force (ratio / poids de corps). */
const STRENGTH_BADGE: Record<string, "squat" | "bench" | "deadlift"> = {
  squat: "squat",
  "back-squat": "squat",
  bench: "bench",
  deadlift: "deadlift",
};

const UPLOAD_TEXTS = [
  "Envoi de la vidéo…",
  "Publication dans le feed…",
  "Ouverture aux votes…",
];

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2 } },
};

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
  const [exercise, setExercise] = useState<LibraryExercise | null>(null);
  const [exQuery, setExQuery] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [analysisIdx, setAnalysisIdx] = useState(0);
  const [userBW, setUserBW] = useState<number>(80);
  const weightRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const exerciseResults = useMemo(() => {
    const q = exQuery.trim();
    if (!q) {
      const favs = ["bench", "squat", "deadlift", "ohp", "pull-up", "curl-barbell", "hip-thrust", "leg-press"];
      const picks = favs
        .map((id) => EXERCISE_LIBRARY.find((e) => e.id === id))
        .filter((e): e is LibraryExercise => Boolean(e));
      return picks;
    }
    return searchExercises(EXERCISE_LIBRARY, q).slice(0, 25);
  }, [exQuery]);

  const canContinueStep2 = weight !== "" && Number(weight) >= 1 && Number(weight) <= 600;
  const videoValid = videoFile && !error;

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setExercise(null);
      setExQuery("");
      setWeight("");
      setReps(1);
      setVideoFile(null);
      setVideoUrl(null);
      setVideoDuration(null);
      setError(null);
      setUploadProgress(0);
      
      setAnalysisIdx(0);
    }
  }, [open]);

  // Load user BW
  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .rpc("get_my_profile")
        .maybeSingle()
        .then(({ data }) => {
          const poids = (data as any)?.poids;
          if (poids) setUserBW(Number(poids));
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
      setAnalysisIdx((p) => (p + 1) % UPLOAD_TEXTS.length);
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
      const el = e.currentTarget;
      const dur = el.duration;
      // iOS/Chrome renvoient parfois Infinity/NaN avant un seek : on force
      // le calcul en seekant très loin, puis on relit dans onDurationChange.
      if (!Number.isFinite(dur) || dur === 0) {
        try {
          el.currentTime = 1e9;
        } catch {
          /* ignore */
        }
        return;
      }
      setVideoDuration(dur);
      if (dur < 3 || dur > 120) {
        setError("La vidéo doit durer entre 3 et 120 secondes");
      } else {
        setError(null);
      }
    },
    []
  );

  const handleDurationChange = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur === 0) return;
      // Remet le curseur au début après le seek "de sondage"
      if (el.currentTime > dur) {
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      setVideoDuration(dur);
      if (dur < 3 || dur > 120) {
        setError("La vidéo doit durer entre 3 et 120 secondes");
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

  const badgeLift = exercise ? STRENGTH_BADGE[exercise.id] : undefined;
  const ratio = badgeLift && weight ? (Number(weight) / userBW).toFixed(2) : null;
  const strengthBadge =
    badgeLift && weight ? computeGradeForLift(badgeLift, Number(weight), userBW) : null;

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

      // Sanitize extension : certains iPhones renvoient "video/quicktime" → .mov
      const guessedExt =
        (videoFile.type.split("/")[1] || videoFile.name.split(".").pop() || "mp4")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 5) || "mp4";
      const path = `${user.id}/${exercise.id}/${Date.now()}.${guessedExt}`;

      setUploadProgress(20);
      const { error: uploadErr } = await supabase.storage
        .from("pr-videos")
        .upload(path, videoFile, {
          contentType: videoFile.type || "video/mp4",
          upsert: false,
        });
      if (uploadErr) {
        // Erreurs Storage typiques : "Payload too large", RLS, quota…
        throw new Error(`Upload vidéo : ${uploadErr.message}`);
      }

      setUploadProgress(60);
      // Bucket privé : on stocke le path pour générer un signedURL plus tard.
      // L'insertion du PR déclenche un trigger DB qui crée automatiquement
      // un post 'pr' dans le feed pour la vérification communautaire.
      await submitPR({
        exercise: exercise.id,
        exercise_name: exercise.name,
        weight_kg: Number(weight),
        reps,
        video_url: path,
      });

      setUploadProgress(85);
      await new Promise((r) => setTimeout(r, 1200));

      setUploadProgress(100);
      track("pr_created", { exercise: exercise.id, reps });
      setStep("victory");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[PRFlow] submit failed:", err);
      setError(msg);
      setStep(4);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleExerciseContinue = () => {
    if (!exercise) return;
    setStep(2);
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
        <SheetTitle className="sr-only">Publier un record</SheetTitle>

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
            {/* ═══ STEP 1 — Exercice (toute la bibliothèque, avec recherche) ═══ */}
            {step === 1 && (
              <motion.div key="s1" {...pageVariants} className="flex flex-col gap-3 pt-5">
                <h2 className="text-center text-2xl font-black text-foreground">Quel exercice ?</h2>
                <p className="text-center text-sm text-arena-sub">
                  N'importe quel exercice de la bibliothèque.
                </p>

                <div className="relative mt-2">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-arena-muted"
                  />
                  <input
                    value={exQuery}
                    onChange={(e) => setExQuery(e.target.value)}
                    placeholder="Rechercher (curl, hack squat, hip thrust…)"
                    className="h-12 w-full rounded-2xl border border-[#262626] bg-[#141414] pl-9 pr-3 text-sm text-foreground outline-none focus:border-arena"
                  />
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  {exerciseResults.map((ex) => {
                    const selected = exercise?.id === ex.id;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => setExercise(ex)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                          selected
                            ? "border-arena bg-arena/10"
                            : "border-[#262626] bg-[#141414]"
                        }`}
                      >
                        {ex.image_url ? (
                          <img
                            src={ex.image_url}
                            alt=""
                            loading="lazy"
                            className="h-11 w-11 shrink-0 rounded-xl border border-[#262626] bg-black object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-arena-gold/10">
                            <Dumbbell size={17} className="text-arena-gold" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-foreground">{ex.name}</span>
                          <span className="block truncate text-[11px] text-arena-sub">
                            {ex.focus ?? ex.primary}
                          </span>
                        </span>
                        {selected && <Check size={18} className="shrink-0 text-arena" />}
                      </button>
                    );
                  })}
                  {exerciseResults.length === 0 && (
                    <p className="py-6 text-center text-sm text-arena-sub">
                      Aucun exercice pour « {exQuery} ».
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!exercise}
                  onClick={handleExerciseContinue}
                  className="sticky bottom-2 mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-arena font-black text-arena-foreground disabled:opacity-40"
                >
                  Continuer <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ═══ STEP 2 — Weight ═══ */}
            {step === 2 && (
              <motion.div key="s2" {...pageVariants} className="flex flex-col gap-4 pt-6">
                <h2 className="text-center text-2xl font-black text-foreground">
                  Combien ?
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
                  <div className="flex flex-wrap justify-center gap-3">
                    {[1, 2, 3, 5, 8, 10].map((r) => (
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
                <h2 className="text-center text-2xl font-black text-foreground">
                  Filme ta tentative
                </h2>

                <div className="mt-4 rounded-2xl border border-arena/30 bg-[#1A0F0F] p-4 text-sm">
                  <p className="mb-2 flex items-center gap-2 font-bold text-foreground">
                    <AlertTriangle size={14} className="text-yellow-500" /> RÈGLES OBLIGATOIRES
                  </p>
                  {[
                    "Plan large (corps entier visible)",
                    "Charges visibles (plaques nettes)",
                    "Une seule prise (pas de coupe)",
                    "Durée entre 3 et 120 secondes",
                  ].map((r, i) => (
                    <p key={i} className="flex items-start gap-2 py-0.5 text-arena-sub">
                      <Check size={14} className="mt-0.5 shrink-0 text-arena-green" /> {r}
                    </p>
                  ))}
                  <p className="mt-2 flex items-start gap-2 text-yellow-500 text-xs">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> Triche détectée = ban définitif
                  </p>
                </div>

                {!videoFile ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        const f = await captureVideo(true);
                        if (f) handleVideoSelect(f);
                      }}
                      className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-arena font-[Anton] text-lg uppercase tracking-wider text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
                    >
                      Filmer maintenant
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        const f = await captureVideo(false);
                        if (f) handleVideoSelect(f);
                      }}
                      className="flex h-16 items-center justify-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] font-[Anton] text-lg uppercase tracking-wider text-arena-sub"
                    >
                      Choisir une vidéo
                    </motion.button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <video
                      src={videoUrl!}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full rounded-2xl border border-[#262626]"
                      onLoadedMetadata={handleVideoLoaded}
                      onDurationChange={handleDurationChange}
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
                <h2 className="text-center text-2xl font-black text-foreground">
                  Prêt à publier ?
                </h2>

                <div className="mt-4 rounded-2xl border border-[#262626] bg-[#141414] p-5">
                  <Row label="Exercice">
                    <span className="max-w-[190px] truncate text-right font-bold text-foreground">
                      {exercise?.name}
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
                  {ratio && (
                    <Row label="Ratio / poids de corps" border>
                      <span className="font-bold text-foreground">{ratio}×</span>
                    </Row>
                  )}
                  {strengthBadge && (
                    <Row label="Badge de force visé" border>
                      <span className="inline-flex items-center gap-1 font-bold text-arena-gold">
                        <GradeIcon grade={strengthBadge} size={14} />
                        {GRADE_LABELS[strengthBadge]}
                      </span>
                    </Row>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  className="mt-6 h-16 w-full rounded-2xl bg-gradient-to-r from-arena to-[#B91C1C] font-[Anton] text-2xl uppercase tracking-wider text-arena-foreground shadow-[0_0_30px_var(--arena-glow)]"
                >
                  <span className="inline-flex items-center gap-2"><Flame size={22} /> Publier mon record</span>
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
                      : "PUBLICATION SUR LE FEED..."}
                  </p>
                  {uploadProgress >= 60 && (
                    <motion.p
                      key={analysisIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-sm text-arena-sub"
                    >
                      {UPLOAD_TEXTS[analysisIdx]}
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
                      <CheckCircle2 size={56} className="text-arena-gold" strokeWidth={2.2} />
                    </motion.div>

                    <h2 className="text-2xl font-black text-foreground">
                      Record publié
                    </h2>

                    <p className="text-center text-sm text-arena-sub">
                      {exercise?.name} — {weight} kg × {reps} rep{reps > 1 ? "s" : ""}
                    </p>

                    {ratio && (
                      <p className="text-sm text-arena-sub">Ratio : {ratio}× ton poids de corps</p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative z-10 mx-4 rounded-2xl border border-arena-gold/40 bg-arena-gold/5 px-5 py-4 text-center"
                >
                  <p className="font-[Anton] text-lg uppercase tracking-wider text-arena-gold">
                    En attente de la communauté
                  </p>
                  <p className="mt-1 text-xs text-arena-sub">
                    Ton PR est publié dans le feed. Il sera vérifié dès qu'il
                    aura reçu <span className="font-bold text-foreground">5 votes « Valide »</span>{" "}
                    (net). Le grade et les XP se débloquent à ce moment-là.
                  </p>
                </motion.div>

                <div className="relative z-10 mt-2 flex w-full flex-col gap-3 px-4">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleClose(true)}
                    className="h-14 w-full rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]"
                  >
                    Voir sur le feed
                  </motion.button>
                  <button
                    onClick={() => handleClose(true)}
                    className="h-12 w-full rounded-2xl border border-[#262626] text-sm font-bold text-arena-sub"
                  >
                    Fermer
                  </button>
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
