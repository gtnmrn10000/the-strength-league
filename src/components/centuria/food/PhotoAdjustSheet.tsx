import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FoodPhotoResult } from "@/lib/foodPhoto.functions";

export default function PhotoAdjustSheet({
  open,
  onOpenChange,
  result,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  result: FoodPhotoResult | null;
  onConfirm: (grams: number) => void | Promise<void>;
}) {
  const [grams, setGrams] = useState<number>(result?.estimated_grams ?? 100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && result) setGrams(result.estimated_grams);
  }, [open, result]);

  const factor = grams / 100;
  const macros = useMemo(() => {
    if (!result) return { kcal: 0, p: 0, c: 0, f: 0 };
    const n = result.nutriments_100g;
    return {
      kcal: Math.round(n.energy_kcal_100g * factor),
      p: Math.round(n.proteins_100g * factor * 10) / 10,
      c: Math.round(n.carbs_100g * factor * 10) / 10,
      f: Math.round(n.fat_100g * factor * 10) / 10,
    };
  }, [result, factor]);

  if (!result) return null;

  const confidenceLabel =
    result.confidence === "high"
      ? "Confiance élevée"
      : result.confidence === "medium"
        ? "Confiance moyenne"
        : "Confiance faible";

  const bump = (delta: number) => setGrams((g) => Math.max(1, Math.min(2000, g + delta)));

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(grams);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {result.brand ? `${result.brand} · ${result.name}` : result.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            {confidenceLabel} · L'IA estime le grammage à l'œil sans référence
            d'échelle : vérifie et ajuste avant d'ajouter.
          </p>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quantité (g)
            </label>
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" size="icon" variant="outline" onClick={() => bump(-10)}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                value={grams}
                onChange={(e) => setGrams(Math.max(1, Math.min(2000, Number(e.target.value) || 0)))}
                className="text-center text-lg font-semibold"
              />
              <Button type="button" size="icon" variant="outline" onClick={() => bump(10)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[50, 100, 150, 200, 250].map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={grams === g ? "default" : "outline"}
                  onClick={() => setGrams(g)}
                >
                  {g} g
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 rounded-lg border p-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">kcal</div>
              <div className="font-semibold">{macros.kcal}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">P</div>
              <div className="font-semibold">{macros.p}g</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">G</div>
              <div className="font-semibold">{macros.c}g</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">L</div>
              <div className="font-semibold">{macros.f}g</div>
            </div>
          </div>

          {result.notes ? (
            <p className="text-xs text-muted-foreground italic">{result.notes}</p>
          ) : null}

          <Button className="w-full" onClick={handleConfirm} disabled={saving}>
            {saving ? "Ajout…" : "Ajouter au journal"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
