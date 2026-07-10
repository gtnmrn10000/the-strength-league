import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FoodProduct } from "@/lib/openFoodFacts";
import { useState, useMemo, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

/** Extrait le nombre de grammes d'une chaîne "serving_size" Open Food Facts (ex: "30 g", "1 portion (25 g)", "250 ml"). */
function parseServingGrams(s: string | null): number | null {
  if (!s) return null;
  const match = s.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i);
  if (!match) return null;
  const n = parseFloat(match[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export default function ProductSheet({
  product,
  open,
  onOpenChange,
  onAdd,
}: {
  product: FoodProduct | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd?: (p: FoodProduct, grams: number) => void;
}) {
  const [grams, setGrams] = useState(100);
  const [raw, setRaw] = useState("100");

  const servingGrams = useMemo(() => parseServingGrams(product?.serving_size ?? null), [product]);

  // Reset quand on change de produit
  useEffect(() => {
    if (!product) return;
    const init = servingGrams ?? 100;
    setGrams(init);
    setRaw(String(init));
  }, [product, servingGrams]);

  const commit = (n: number) => {
    const clamped = Math.max(1, Math.min(5000, Math.round(n)));
    setGrams(clamped);
    setRaw(String(clamped));
  };

  const scaled = useMemo(() => {
    if (!product) return null;
    const f = grams / 100;
    const n = product.nutriments;
    return {
      kcal: n.energy_kcal_100g != null ? Math.round(n.energy_kcal_100g * f) : null,
      prot: n.proteins_100g != null ? +(n.proteins_100g * f).toFixed(1) : null,
      carbs: n.carbs_100g != null ? +(n.carbs_100g * f).toFixed(1) : null,
      fat: n.fat_100g != null ? +(n.fat_100g * f).toFixed(1) : null,
      sugars: n.sugars_100g != null ? +(n.sugars_100g * f).toFixed(1) : null,
      fiber: n.fiber_100g != null ? +(n.fiber_100g * f).toFixed(1) : null,
      salt: n.salt_100g != null ? +(n.salt_100g * f).toFixed(2) : null,
    };
  }, [product, grams]);

  if (!product) return null;

  const shortcuts: { label: string; value: number }[] = [
    { label: "100 g", value: 100 },
    ...(servingGrams ? [{ label: `Portion (${servingGrams} g)`, value: servingGrams }] : []),
    { label: "50 g", value: 50 },
    { label: "250 g", value: 250 },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-arena-border bg-background p-0">
        <SheetHeader className="border-b border-arena-border p-4 text-left">
          <SheetTitle className="text-base font-black text-foreground">{product.name}</SheetTitle>
          {product.brand && <p className="text-xs text-arena-muted">{product.brand}</p>}
        </SheetHeader>

        <div className="p-4">
          <div className="mb-4 flex gap-4">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-24 w-24 rounded-xl bg-arena-surface object-contain" />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-arena-surface" />
            )}
            <div className="flex flex-1 flex-col gap-2">
              {product.nutriscore && (
                <Badge label={`Nutri-Score ${product.nutriscore.toUpperCase()}`} tone={scoreTone(product.nutriscore)} />
              )}
              {product.nova_group != null && <Badge label={`NOVA ${product.nova_group}`} tone={novaTone(product.nova_group)} />}
              <span className="text-[10px] text-arena-muted">Code : {product.barcode}</span>
            </div>
          </div>

          {/* Bloc quantité — style Yazio */}
          <div className="mb-4 rounded-2xl border border-arena-border bg-arena-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-arena-muted">QUANTITÉ</span>
              <span className="text-[10px] text-arena-sub">1 g de précision</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => commit(grams - 1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-arena-border bg-background active:scale-90"
                aria-label="Retirer 1 gramme"
              >
                <Minus size={16} />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={5000}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  onBlur={() => {
                    const n = parseInt(raw, 10);
                    if (Number.isFinite(n)) commit(n);
                    else commit(grams);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                  }}
                  className="h-11 w-full rounded-xl border border-arena-gold/40 bg-background pr-10 text-center text-lg font-black text-foreground focus:border-arena-gold focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-arena-muted">
                  g
                </span>
              </div>

              <button
                onClick={() => commit(grams + 1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-arena-border bg-background active:scale-90"
                aria-label="Ajouter 1 gramme"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Raccourcis */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shortcuts.map((s) => {
                const active = grams === s.value;
                return (
                  <button
                    key={s.label}
                    onClick={() => commit(s.value)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-black tracking-wider transition ${
                      active
                        ? "border-arena-gold bg-arena-gold text-black"
                        : "border-arena-border bg-background text-arena-sub hover:border-arena-gold/50"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
              <button
                onClick={() => commit(grams + 10)}
                className="rounded-full border border-arena-border bg-background px-3 py-1 text-[11px] font-black tracking-wider text-arena-sub hover:border-arena-gold/50"
              >
                +10 g
              </button>
            </div>

            {product.serving_size && (
              <p className="mt-3 text-[11px] text-arena-sub">Portion suggérée : {product.serving_size}</p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Stat label="Kcal" value={scaled?.kcal} />
            <Stat label="Prot" value={scaled?.prot} unit="g" />
            <Stat label="Gluc" value={scaled?.carbs} unit="g" />
            <Stat label="Lip" value={scaled?.fat} unit="g" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Sucres" value={scaled?.sugars} unit="g" small />
            <Stat label="Fibres" value={scaled?.fiber} unit="g" small />
            <Stat label="Sel" value={scaled?.salt} unit="g" small />
          </div>

          {onAdd && (
            <button
              onClick={() => onAdd(product, grams)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black text-arena-on active:scale-[0.98]"
            >
              <Plus size={16} /> Ajouter {grams} g à mon journal
            </button>
          )}

          <p className="mt-4 text-center text-[10px] text-arena-muted">
            Données Open Food Facts — libres et collaboratives.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, unit, small }: { label: string; value: number | null | undefined; unit?: string; small?: boolean }) {
  return (
    <div className={`rounded-xl border border-arena-border bg-arena-surface p-2 text-center ${small ? "" : ""}`}>
      <p className={`font-black text-foreground ${small ? "text-xs" : "text-sm"}`}>
        {value == null ? "—" : `${value}${unit ?? ""}`}
      </p>
      <p className="text-[9px] uppercase tracking-widest text-arena-muted">{label}</p>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider ${tone}`}>
      {label}
    </span>
  );
}

function scoreTone(s: string) {
  switch (s.toLowerCase()) {
    case "a": return "bg-green-500/20 text-green-400";
    case "b": return "bg-lime-500/20 text-lime-400";
    case "c": return "bg-yellow-500/20 text-yellow-400";
    case "d": return "bg-orange-500/20 text-orange-400";
    case "e": return "bg-red-500/20 text-red-400";
    default: return "bg-arena-surface text-arena-muted";
  }
}
function novaTone(n: number) {
  if (n <= 2) return "bg-green-500/20 text-green-400";
  if (n === 3) return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
}
