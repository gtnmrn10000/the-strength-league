import { Plus, ScanLine, Search, Loader2, Trash2, PackageX, Camera, Sparkles, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recognizeFoodPhoto } from "@/lib/foodPhoto.functions";
import BarcodeScanner from "./food/BarcodeScanner";
import ProductSheet from "./food/ProductSheet";
import ManualEntrySheet from "./food/ManualEntrySheet";
import { FoodProduct, fetchProductByBarcode, searchProducts } from "@/lib/openFoodFacts";
import {
  FoodLog,
  FoodSource,
  addFoodLog,
  addFoodLogFromProduct,
  deleteFoodLog,
  fetchTodayLogs,
} from "@/lib/foodLogs";
import { supabase } from "@/integrations/supabase/client";
import {
  ActivityLevel,
  DEFAULT_GOALS,
  MacroGoals,
  Sexe,
  macroGoalsFromTdee,
  tdee,
} from "@/lib/nutrition";
import { toast } from "sonner";

export default function Meals() {
  const [showScanner, setShowScanner] = useState(false);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDefaultName, setManualDefaultName] = useState<string>("");
  const [pendingSource, setPendingSource] = useState<FoodSource>("manual");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [goals, setGoals] = useState<MacroGoals>(DEFAULT_GOALS);

  const reloadLogs = useCallback(async () => {
    try {
      setLogs(await fetchTodayLogs());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    reloadLogs();
  }, [reloadLogs]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("sexe, age, poids, taille, niveau_activite")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!data) return;
      const { sexe, age, poids, taille, niveau_activite } = data as {
        sexe: Sexe | null;
        age: number | null;
        poids: number | null;
        taille: number | null;
        niveau_activite: ActivityLevel | null;
      };
      if (sexe && age && poids && taille) {
        const kcal = tdee({
          sexe,
          age,
          poids_kg: Number(poids),
          taille_cm: Number(taille),
          activite: niveau_activite ?? "modere",
        });
        setGoals(macroGoalsFromTdee(kcal));
      }
    })();
  }, []);

  const handleBarcode = async (code: string) => {
    setShowScanner(false);
    setLoading(true);
    try {
      const p = await fetchProductByBarcode(code);
      if (!p) {
        toast.error("Produit introuvable. Passe en saisie manuelle.");
        setManualDefaultName("");
        setManualOpen(true);
      } else {
        setProduct(p);
        setPendingSource("barcode");
        setSheetOpen(true);
      }
    } catch {
      toast.error("Erreur réseau, réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await searchProducts(query.trim());
      setResults(r);
      if (r.length === 0) toast.info("Aucun résultat.");
    } catch {
      toast.error("Erreur de recherche.");
    } finally {
      setLoading(false);
    }
  };

  const addToJournal = async (p: FoodProduct, grams: number) => {
    try {
      await addFoodLogFromProduct(p, grams, pendingSource);
      setSheetOpen(false);
      toast.success(`${p.name} ajouté (${grams} g).`);
      reloadLogs();
    } catch (e) {
      toast.error("Impossible d'ajouter au journal.");
    }
  };

  const handleManualSubmit = async (entry: {
    product_name: string;
    quantity_g: number;
    calories: number;
    proteins_g: number;
    carbs_g: number;
    fats_g: number;
  }) => {
    try {
      await addFoodLog({ source: "manual", ...entry });
      setManualOpen(false);
      toast.success(`${entry.product_name} ajouté.`);
      reloadLogs();
    } catch {
      toast.error("Impossible d'ajouter au journal.");
    }
  };

  const handleDelete = async (id: string) => {
    const prev = logs;
    setLogs((l) => l.filter((x) => x.id !== id));
    try {
      await deleteFoodLog(id);
    } catch {
      setLogs(prev);
      toast.error("Suppression impossible.");
    }
  };

  const totals = useMemo(
    () =>
      logs.reduce(
        (a, e) => ({
          kcal: a.kcal + Number(e.calories),
          prot: a.prot + Number(e.proteins_g),
          carbs: a.carbs + Number(e.carbs_g),
          fat: a.fat + Number(e.fats_g),
        }),
        { kcal: 0, prot: 0, carbs: 0, fat: 0 },
      ),
    [logs],
  );

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-4 rounded-2xl border border-arena-border bg-arena-surface p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs font-black tracking-widest text-arena-muted">AUJOURD'HUI</span>
          <span className="text-[11px] text-arena-muted">
            {Math.round(totals.kcal)} / {goals.kcal} kcal
          </span>
        </div>
        <ProgressBar label="Kcal" value={totals.kcal} goal={goals.kcal} unit="" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <ProgressBar label="Prot" value={totals.prot} goal={goals.prot} unit="g" compact />
          <ProgressBar label="Gluc" value={totals.carbs} goal={goals.carbs} unit="g" compact />
          <ProgressBar label="Lip" value={totals.fat} goal={goals.fat} unit="g" compact />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowScanner(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black text-arena-on active:scale-[0.98]"
        >
          <ScanLine size={18} /> Scanner
        </button>
        <button
          onClick={() => {
            setManualDefaultName("");
            setManualOpen(true);
          }}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-arena-border bg-arena-surface text-sm font-bold text-foreground active:scale-[0.98]"
        >
          <Plus size={16} /> Saisie manuelle
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-arena-border bg-arena-surface px-3">
          <Search size={14} className="text-arena-muted" />
          <input
            id="food-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un aliment…"
            className="h-11 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-arena-muted"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-arena px-4 text-xs font-black text-arena-on disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "OK"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-black tracking-widest text-arena-muted">RÉSULTATS</h3>
          <ul className="flex flex-col gap-2">
            {results.map((p) => (
              <li key={p.barcode}>
                <button
                  onClick={() => {
                    setProduct(p);
                    setPendingSource("manual");
                    setSheetOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3 text-left active:scale-[0.99]"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg bg-black object-contain" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-black" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                    {p.brand && <p className="truncate text-[11px] text-arena-muted">{p.brand}</p>}
                  </div>
                  {p.nutriments.energy_kcal_100g != null && (
                    <span className="text-xs font-black text-arena">
                      {Math.round(p.nutriments.energy_kcal_100g)} kcal
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setManualDefaultName(query);
              setManualOpen(true);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-arena-border p-3 text-xs font-bold text-arena-muted active:scale-[0.99]"
          >
            <PackageX size={14} /> Pas trouvé ? Saisir manuellement
          </button>
        </div>
      )}

      <h3 className="mb-3 text-xs font-black tracking-widest text-arena-muted">JOURNAL DU JOUR</h3>
      {logs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-arena-border p-6 text-center text-xs text-arena-muted">
          Scanne un produit ou cherche un aliment pour démarrer.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {logs.map((e) => {
            const t = new Date(e.logged_at);
            const hh = `${t.getHours().toString().padStart(2, "0")}:${t
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-[10px] font-black text-arena-muted">
                  {hh}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{e.product_name}</p>
                  <p className="text-[11px] text-arena-muted">
                    {Number(e.quantity_g)} g · {Math.round(Number(e.proteins_g))}P /{" "}
                    {Math.round(Number(e.carbs_g))}G / {Math.round(Number(e.fats_g))}L
                  </p>
                </div>
                <span className="text-xs font-black text-arena">{Math.round(Number(e.calories))} kcal</span>
                <button
                  onClick={() => handleDelete(e.id)}
                  aria-label="Supprimer"
                  className="rounded-full p-1 text-arena-muted active:scale-90"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showScanner && <BarcodeScanner onDetected={handleBarcode} onClose={() => setShowScanner(false)} />}
      <ProductSheet product={product} open={sheetOpen} onOpenChange={setSheetOpen} onAdd={addToJournal} />
      <ManualEntrySheet
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSubmit={handleManualSubmit}
        defaultName={manualDefaultName}
      />
    </div>
  );
}

function ProgressBar({
  label,
  value,
  goal,
  unit,
  compact,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  compact?: boolean;
}) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  const over = value > goal;
  return (
    <div className={compact ? "" : "w-full"}>
      <div className="mb-1 flex items-baseline justify-between gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-arena-muted">{label}</span>
        <span className={`text-[10px] font-bold ${over ? "text-red-400" : "text-foreground"}`}>
          {Math.round(value)}
          {unit}
          <span className="text-arena-muted"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-arena"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
