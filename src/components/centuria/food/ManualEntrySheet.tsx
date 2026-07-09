import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export type ManualEntry = {
  product_name: string;
  quantity_g: number;
  calories: number;
  proteins_g: number;
  carbs_g: number;
  fats_g: number;
};

export default function ManualEntrySheet({
  open,
  onOpenChange,
  onSubmit,
  defaultName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (e: ManualEntry) => void | Promise<void>;
  defaultName?: string;
}) {
  const [name, setName] = useState("");
  const [grams, setGrams] = useState<string>("100");
  const [kcal, setKcal] = useState("");
  const [prot, setProt] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName ?? "");
      setGrams("100");
      setKcal(""); setProt(""); setCarbs(""); setFat("");
    }
  }, [open, defaultName]);

  const canSubmit = name.trim().length > 0 && Number(grams) > 0 && kcal !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        product_name: name.trim(),
        quantity_g: Number(grams),
        calories: Math.round(Number(kcal) || 0),
        proteins_g: +(Number(prot) || 0).toFixed(1),
        carbs_g: +(Number(carbs) || 0).toFixed(1),
        fats_g: +(Number(fat) || 0).toFixed(1),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-arena-border bg-background p-0">
        <SheetHeader className="border-b border-arena-border p-4 text-left">
          <SheetTitle className="text-base font-black text-foreground">Saisie manuelle</SheetTitle>
          <p className="text-xs text-arena-muted">Renseigne les macros pour la quantité indiquée.</p>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          <Field label="Nom" value={name} onChange={setName} placeholder="Ex : Omelette 3 œufs" />
          <Field label="Quantité (g)" value={grams} onChange={setGrams} type="number" inputMode="numeric" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kcal" value={kcal} onChange={setKcal} type="number" inputMode="numeric" />
            <Field label="Protéines (g)" value={prot} onChange={setProt} type="number" inputMode="decimal" />
            <Field label="Glucides (g)" value={carbs} onChange={setCarbs} type="number" inputMode="decimal" />
            <Field label="Lipides (g)" value={fat} onChange={setFat} type="number" inputMode="decimal" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black text-arena-on disabled:opacity-50 active:scale-[0.98]"
          >
            <Plus size={16} /> {saving ? "Ajout…" : "Ajouter à mon journal"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal";
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-arena-muted">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-arena-border bg-arena-surface px-3 text-sm text-foreground outline-none focus:border-arena"
      />
    </label>
  );
}
