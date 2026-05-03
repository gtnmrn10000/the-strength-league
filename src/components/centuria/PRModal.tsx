import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";

export default function PRModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl border-t border-arena-border bg-background p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Enregistrer un PR</h2>
          <button onClick={onClose}>
            <X size={20} className="text-arena-muted" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {["Squat", "Bench", "DL"].map((x, i) => (
            <button
              key={x}
              className={`rounded-full px-4 py-2 text-xs font-bold ${i === 1 ? "bg-arena text-arena-foreground" : "border border-arena-border bg-arena-surface text-arena-sub"}`}
            >
              {x}
            </button>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-arena-border bg-arena-surface p-4 text-center">
          <span className="text-xs text-arena-sub">Poids</span>
          <p className="mt-1 text-3xl font-black text-foreground">130 KG</p>
        </div>

        <p className="mb-4 text-xs text-arena-muted">
          Règles : plan large, charges visibles, une seule prise, 15-60 sec.
        </p>

        <button className="mb-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-arena font-bold text-arena-foreground shadow-[0_0_25px_var(--arena-glow)]">
          <Camera size={18} />
          Uploader la vidéo
        </button>

        <button onClick={onClose} className="h-12 w-full rounded-2xl border border-arena-border text-sm font-bold text-arena-sub">
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}
