import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Scale, Plus, Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

type WeighIn = {
  id: string;
  weight_kg: number;
  bodyfat_pct: number | null;
  waist_cm: number | null;
  measured_at: string;
  note: string | null;
};

export default function WeighIns({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<WeighIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState("");
  const [bodyfat, setBodyfat] = useState("");
  const [waist, setWaist] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("weigh_ins")
        .select("id, weight_kg, bodyfat_pct, waist_cm, measured_at, note")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: true })
        .limit(90);
      setRows((data as WeighIn[] | null) ?? []);
      setLoading(false);
    })();
  }, [open]);

  const handleSave = async () => {
    const w = parseFloat(weight.replace(",", "."));
    if (!Number.isFinite(w) || w <= 20 || w >= 400) {
      toast.error("Poids invalide");
      return;
    }
    const bf = bodyfat ? parseFloat(bodyfat.replace(",", ".")) : null;
    const ws = waist ? parseFloat(waist.replace(",", ".")) : null;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { data, error } = await supabase.from("weigh_ins").insert({
        user_id: user.id,
        weight_kg: w,
        bodyfat_pct: bf,
        waist_cm: ws,
      }).select("*").single();
      if (error) throw error;
      // synchro poids courant sur le profil
      await supabase.from("profiles").update({ poids: w }).eq("user_id", user.id);
      setRows((r) => [...r, data as WeighIn]);
      setWeight(""); setBodyfat(""); setWaist("");
      toast.success("Pesée enregistrée");
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const first = rows[0];
    const last = rows[rows.length - 1];
    const delta = +(last.weight_kg - first.weight_kg).toFixed(1);
    return { first, last, delta };
  }, [rows]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm font-black tracking-widest text-foreground">
            <Scale size={16} className="text-arena" /> PESÉES & COMPOSITION
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Nouveau formulaire */}
          <div className="rounded-2xl border border-arena-border bg-arena-surface p-4">
            <p className="mb-3 text-[10px] font-black tracking-widest text-arena-muted">NOUVELLE PESÉE</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Poids (kg)" value={weight} onChange={setWeight} placeholder="82.5" />
              <Field label="BF %" value={bodyfat} onChange={setBodyfat} placeholder="15" />
              <Field label="Taille cm" value={waist} onChange={setWaist} placeholder="82" />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !weight}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-arena-gold py-2.5 text-xs font-black tracking-widest text-black active:scale-[0.98] disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={3} />} ENREGISTRER
            </button>
          </div>

          {/* Stats + graph */}
          {loading ? (
            <div className="mt-6 flex justify-center"><Loader2 size={20} className="animate-spin text-arena" /></div>
          ) : rows.length === 0 ? (
            <p className="mt-6 text-center text-xs text-arena-muted">
              Aucune pesée enregistrée. Commence par ta première ci-dessus.
            </p>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <StatBox label="Actuel" value={`${stats!.last.weight_kg} kg`} />
                <StatBox label="Départ" value={`${stats!.first.weight_kg} kg`} />
                <StatBox
                  label="Δ"
                  value={`${stats!.delta > 0 ? "+" : ""}${stats!.delta} kg`}
                  trend={stats!.delta === 0 ? "flat" : stats!.delta > 0 ? "up" : "down"}
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-black tracking-widest text-arena-muted">COURBE</p>
                <WeightChart rows={rows} />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-black tracking-widest text-arena-muted">HISTORIQUE</p>
                <ul className="flex flex-col gap-1.5">
                  {[...rows].reverse().slice(0, 30).map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-xl border border-arena-border bg-arena-surface px-3 py-2">
                      <span className="text-[11px] text-arena-sub">
                        {new Date(r.measured_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                      </span>
                      <span className="text-xs font-black text-foreground">
                        {r.weight_kg} kg
                        {r.bodyfat_pct != null && <span className="ml-1 text-arena-sub font-normal">· {r.bodyfat_pct}% BF</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-black tracking-widest text-arena-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-arena-border bg-secondary px-2 py-2 text-center text-sm font-black text-foreground focus:border-arena focus:outline-none"
      />
    </label>
  );
}

function StatBox({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" | "flat" }) {
  const color = trend === "down" ? "text-green-400" : trend === "up" ? "text-red-400" : "text-foreground";
  const Icon = trend === "down" ? TrendingDown : trend === "up" ? TrendingUp : Minus;
  return (
    <div className="rounded-xl border border-arena-border bg-arena-surface p-3 text-center">
      <p className={`flex items-center justify-center gap-1 text-sm font-black ${color}`}>
        {trend && <Icon size={12} />} {value}
      </p>
      <p className="mt-0.5 text-[9px] font-black tracking-widest text-arena-muted">{label}</p>
    </div>
  );
}

function WeightChart({ rows }: { rows: WeighIn[] }) {
  const w = 320, h = 140, pad = 24;
  const min = Math.min(...rows.map((r) => r.weight_kg));
  const max = Math.max(...rows.map((r) => r.weight_kg));
  const range = Math.max(1, max - min);
  const t0 = new Date(rows[0].measured_at).getTime();
  const tN = new Date(rows[rows.length - 1].measured_at).getTime();
  const tR = Math.max(1, tN - t0);

  const points = rows.map((r) => {
    const x = pad + ((new Date(r.measured_at).getTime() - t0) / tR) * (w - pad * 2);
    const y = h - pad - ((r.weight_kg - min) / range) * (h - pad * 2);
    return { x, y, r };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={pad} x2={w - pad} y1={pad + (h - pad * 2) * k} y2={pad + (h - pad * 2) * k} stroke="rgba(212,175,55,0.12)" strokeDasharray="2 3" />
        ))}
        <motion.path d={area} fill="url(#wArea)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        <motion.path
          d={path}
          fill="none"
          stroke="#D4AF37"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#F0D875" stroke="#0b0b0d" strokeWidth={1} />
        ))}
        {/* Labels */}
        <text x={pad} y={pad - 6} fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700">{max}kg</text>
        <text x={pad} y={h - 6} fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700">{min}kg</text>
      </svg>
    </div>
  );
}
