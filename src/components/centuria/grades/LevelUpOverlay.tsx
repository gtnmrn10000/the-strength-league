import { AnimatePresence, motion } from "framer-motion";
import { GradeIcon } from "@/lib/gradeIcons";
import { GRADE_LABELS, type Grade } from "@/lib/grades";

/**
 * Overlay plein écran de passage de grade. À déclencher une seule fois par
 * franchissement de seuil (ex : quand `awardWorkoutXp` renvoie
 * `leveledUp: true` — le composant appelant est responsable de ne
 * l'ouvrir qu'une fois par transition, ex. via un flag local).
 */
export default function LevelUpOverlay({
  open,
  previousGrade,
  newGrade,
  onContinue,
}: {
  open: boolean;
  previousGrade: Grade;
  newGrade: Grade;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="absolute"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <GradeIcon grade={previousGrade} size={96} />
          </motion.div>

          <motion.div
            className="h-px w-40 bg-gradient-to-r from-transparent via-arena-gold to-transparent"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ marginBottom: 24 }}
          />

          <p className="mb-6 text-[10px] font-black tracking-[0.3em] text-arena-sub">
            GRADE DÉBLOQUÉ
          </p>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 220, damping: 16 }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 60px rgba(212,175,55,0.35)" }}
            />
            <GradeIcon grade={newGrade} size={140} />
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-white/40"
                style={{ filter: "blur(8px)" }}
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ delay: 0.75, duration: 0.9, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>

          <motion.p
            className="mt-6 text-2xl font-black tracking-wide text-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            {GRADE_LABELS[newGrade]}
          </motion.p>

          <motion.button
            onClick={onContinue}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-10 rounded-full border border-arena-gold/50 bg-arena-gold/10 px-8 py-2.5 text-xs font-black tracking-widest text-arena-gold active:scale-95 transition"
          >
            CONTINUER
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
