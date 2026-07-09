import { Plus, ScanLine, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import BarcodeScanner from "./food/BarcodeScanner";
import ProductSheet from "./food/ProductSheet";
import { FoodProduct, fetchProductByBarcode, searchProducts } from "@/lib/openFoodFacts";
import { toast } from "sonner";

type JournalEntry = { product: FoodProduct; grams: number; at: number };

export default function Meals() {
  const [showScanner, setShowScanner] = useState(false);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  const handleBarcode = async (code: string) => {
    setShowScanner(false);
    setLoading(true);
    try {
      const p = await fetchProductByBarcode(code);
      if (!p) {
        toast.error("Produit introuvable dans Open Food Facts.");
      } else {
        setProduct(p);
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

  const addToJournal = (p: FoodProduct, grams: number) => {
    setJournal((j) => [{ product: p, grams, at: Date.now() }, ...j]);
    setSheetOpen(false);
    toast.success(`${p.name} ajouté (${grams} g).`);
  };

  const totals = journal.reduce(
    (a, e) => {
      const f = e.grams / 100;
      const n = e.product.nutriments;
      a.kcal += (n.energy_kcal_100g ?? 0) * f;
      a.prot += (n.proteins_100g ?? 0) * f;
      a.carbs += (n.carbs_100g ?? 0) * f;
      a.fat += (n.fat_100g ?? 0) * f;
      return a;
    },
    { kcal: 0, prot: 0, carbs: 0, fat: 0 },
  );

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        <Tile label="Kcal" value={Math.round(totals.kcal)} />
        <Tile label="Prot" value={`${Math.round(totals.prot)}g`} />
        <Tile label="Gluc" value={`${Math.round(totals.carbs)}g`} />
        <Tile label="Lip" value={`${Math.round(totals.fat)}g`} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowScanner(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-arena text-sm font-black text-arena-on active:scale-[0.98]"
        >
          <ScanLine size={18} /> Scanner
        </button>
        <button
          onClick={() => document.getElementById("food-search")?.focus()}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-arena-border bg-arena-surface text-sm font-bold text-foreground active:scale-[0.98]"
        >
          <Plus size={16} /> Ajouter manuel
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
                  onClick={() => { setProduct(p); setSheetOpen(true); }}
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
                    <span className="text-xs font-black text-arena">{Math.round(p.nutriments.energy_kcal_100g)} kcal</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="mb-3 text-xs font-black tracking-widest text-arena-muted">JOURNAL DU JOUR</h3>
      {journal.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-arena-border p-6 text-center text-xs text-arena-muted">
          Scanne un produit ou cherche un aliment pour démarrer.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {journal.map((e, i) => {
            const f = e.grams / 100;
            const kcal = Math.round((e.product.nutriments.energy_kcal_100g ?? 0) * f);
            return (
              <li key={i} className="flex items-center gap-3 rounded-2xl border border-arena-border bg-arena-surface p-3">
                {e.product.image_url ? (
                  <img src={e.product.image_url} alt="" className="h-10 w-10 rounded-lg bg-black object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-black" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{e.product.name}</p>
                  <p className="text-[11px] text-arena-muted">{e.grams} g</p>
                </div>
                <span className="text-xs font-black text-arena">{kcal} kcal</span>
              </li>
            );
          })}
        </ul>
      )}

      {showScanner && <BarcodeScanner onDetected={handleBarcode} onClose={() => setShowScanner(false)} />}
      <ProductSheet product={product} open={sheetOpen} onOpenChange={setSheetOpen} onAdd={addToJournal} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-arena-border bg-arena-surface p-2">
      <p className="text-sm font-black text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-arena-muted">{label}</p>
    </div>
  );
}
