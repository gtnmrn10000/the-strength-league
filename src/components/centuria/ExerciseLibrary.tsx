import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Star, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  EXERCISE_LIBRARY,
  CATEGORY_LABEL,
  CATEGORY_ICON,
  CATEGORY_ACCENT,
  EQUIPMENT_LABEL,
  searchExercises,
  type Equipment,
  type LibraryExercise,
  type MuscleCategory,
} from "@/lib/exerciseCatalog";
import {
  createCustomExercise,
  fetchCustomExercises,
  fetchFavorites,
  fetchLastPerformances,
  getRecentIds,
  lastPerfFor,
  pushRecentId,
  toggleFavorite,
  type LastPerf,
} from "@/lib/exerciseUserData";

const CATEGORIES: (MuscleCategory | "all")[] = ["all", "pectoraux", "dos", "jambes", "epaules", "bras", "abdos"];
const EQUIPMENTS: (Equipment | "all")[] = [
  "all",
  "barre",
  "halteres",
  "poulie",
  "machine",
  "smith",
  "poids_du_corps",
  "kettlebell",
  "elastique",
];

const PRIMARY_OPTIONS: { key: string; label: string }[] = [
  { key: "pectoraux", label: "Pectoraux" },
  { key: "dos", label: "Dos" },
  { key: "epaules", label: "Épaules" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "avant_bras", label: "Avant-bras" },
  { key: "quadriceps", label: "Quadriceps" },
  { key: "ischios", label: "Ischios" },
  { key: "fessiers", label: "Fessiers" },
  { key: "mollets", label: "Mollets" },
  { key: "abdos", label: "Abdos" },
];

export default function ExerciseLibrary({
  open,
  onOpenChange,
  onAdd,
  onOpenDetail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd?: (ex: LibraryExercise) => void;
  onOpenDetail?: (name: string) => void;
}) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [eq, setEq] = useState<(typeof EQUIPMENTS)[number]>("all");
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [custom, setCustom] = useState<LibraryExercise[]>([]);
  const [perfs, setPerfs] = useState<Record<string, LastPerf>>({});
  const [recents, setRecents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRecents(getRecentIds());
    void (async () => {
      const [f, c, p] = await Promise.all([
        fetchFavorites(),
        fetchCustomExercises(),
        fetchLastPerformances(),
      ]);
      setFavorites(f);
      setCustom(c);
      setPerfs(p);
    })();
  }, [open]);

  const all = useMemo(() => [...custom, ...EXERCISE_LIBRARY], [custom]);

  const filtered = useMemo(() => {
    const base = all.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (eq !== "all" && e.equipment !== eq) return false;
      return true;
    });
    return searchExercises(base, q);
  }, [all, cat, eq, q]);

  const showSections = !q.trim() && cat === "all" && eq === "all";
  const favList = useMemo(
    () => all.filter((e) => favorites.includes(e.id)),
    [all, favorites],
  );
  const recentList = useMemo(
    () => recents.map((id) => all.find((e) => e.id === id)).filter((e): e is LibraryExercise => !!e),
    [all, recents],
  );

  const onToggleFav = useCallback(
    async (ex: LibraryExercise) => {
      const isFav = favorites.includes(ex.id);
      setFavorites((f) => (isFav ? f.filter((x) => x !== ex.id) : [...f, ex.id]));
      const ok = await toggleFavorite(ex.id, isFav);
      if (!ok) {
        setFavorites((f) => (isFav ? [...f, ex.id] : f.filter((x) => x !== ex.id)));
        toast.error("Favori non enregistré. Reconnecte-toi.");
      }
    },
    [favorites],
  );

  const handleAdd = (ex: LibraryExercise) => {
    pushRecentId(ex.id);
    setRecents(getRecentIds());
    onAdd?.(ex);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-md mx-auto p-0 flex flex-col bg-background border-arena-border"
      >
        <SheetHeader className="border-b border-arena-border px-4 py-3">
          <SheetTitle className="flex items-center justify-between text-sm font-black tracking-widest text-foreground">
            <span>BIBLIOTHÈQUE</span>
            <button
              onClick={() => setCreating((c) => !c)}
              className="flex items-center gap-1 rounded-full border border-arena-border px-2 py-1 text-[10px] font-black text-arena"
            >
              {creating ? <X size={12} /> : <Plus size={12} />} EXO PERSO
            </button>
          </SheetTitle>
        </SheetHeader>

        <div className="border-b border-arena-border px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-arena-muted" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (dc, squat, poulie…)"
              className="h-11 w-full rounded-xl border border-arena-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-arena-muted focus:border-arena focus:outline-none"
            />
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c === "all" ? "TOUT" : CATEGORY_LABEL[c].toUpperCase()}
              </Chip>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {EQUIPMENTS.map((e) => (
              <Chip key={e} active={eq === e} muted onClick={() => setEq(e)}>
                {e === "all" ? "TOUT MATÉRIEL" : EQUIPMENT_LABEL[e].toUpperCase()}
              </Chip>
            ))}
          </div>
        </div>

        {creating && (
          <CustomExerciseForm
            onCreated={(ex) => {
              setCustom((c) => [ex, ...c]);
              setCreating(false);
              toast.success("Exercice ajouté à ta bibliothèque");
            }}
          />
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          {showSections && favList.length > 0 && (
            <Section title="FAVORIS">
              {favList.map((ex) => (
                <Row
                  key={`fav-${ex.id}`}
                  ex={ex}
                  fav
                  perf={lastPerfFor(perfs, ex.name)}
                  onAdd={onAdd ? () => handleAdd(ex) : undefined}
                  onFav={() => onToggleFav(ex)}
                  onDetail={onOpenDetail ? () => onOpenDetail(ex.name) : undefined}
                />
              ))}
            </Section>
          )}

          {showSections && recentList.length > 0 && (
            <Section title="RÉCENTS">
              {recentList.map((ex) => (
                <Row
                  key={`rec-${ex.id}`}
                  ex={ex}
                  fav={favorites.includes(ex.id)}
                  perf={lastPerfFor(perfs, ex.name)}
                  onAdd={onAdd ? () => handleAdd(ex) : undefined}
                  onFav={() => onToggleFav(ex)}
                  onDetail={onOpenDetail ? () => onOpenDetail(ex.name) : undefined}
                />
              ))}
            </Section>
          )}

          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-xs text-arena-muted">Aucun exercice trouvé</p>
          ) : (
            <Section title={`TOUS LES EXERCICES · ${filtered.length}`}>
              {filtered.map((ex) => (
                <Row
                  key={ex.id}
                  ex={ex}
                  fav={favorites.includes(ex.id)}
                  perf={lastPerfFor(perfs, ex.name)}
                  onAdd={onAdd ? () => handleAdd(ex) : undefined}
                  onFav={() => onToggleFav(ex)}
                  onDetail={onOpenDetail ? () => onOpenDetail(ex.name) : undefined}
                />
              ))}
            </Section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Chip({
  active,
  muted,
  onClick,
  children,
}: {
  active: boolean;
  muted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black tracking-widest transition ${
        active
          ? muted
            ? "border-arena bg-arena/15 text-arena"
            : "border-arena-gold bg-arena-gold text-black"
          : "border-arena-border bg-arena-surface text-arena-sub"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-[10px] font-black tracking-widest text-arena-muted">{title}</h4>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function Row({
  ex,
  fav,
  perf,
  onAdd,
  onFav,
  onDetail,
}: {
  ex: LibraryExercise;
  fav: boolean;
  perf?: LastPerf;
  onAdd?: () => void;
  onFav: () => void;
  onDetail?: () => void;
}) {
  const Icon = CATEGORY_ICON[ex.category];
  const accent = CATEGORY_ACCENT[ex.category];
  const [imgOk, setImgOk] = useState(true);
  return (
    <li className="flex items-center gap-2 rounded-2xl border border-arena-border bg-arena-surface p-2.5">
      {ex.image_url && imgOk ? (
        <img
          src={ex.image_url}
          alt={ex.name}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="h-12 w-12 shrink-0 rounded-xl border border-arena-border bg-black object-cover"
        />
      ) : (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}1a`, boxShadow: `0 0 0 1px ${accent}33 inset` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <button
          onClick={onDetail}
          disabled={!onDetail}
          className="block max-w-full truncate text-left text-sm font-black text-foreground disabled:cursor-default"
        >
          {ex.name}
        </button>
        <p className="mt-0.5 truncate text-[10px] text-arena-sub">
          {ex.focus ?? CATEGORY_LABEL[ex.category]} · {EQUIPMENT_LABEL[ex.equipment]}
          {ex.custom ? " · perso" : ""}
        </p>
        {perf && (
          <p className="mt-0.5 truncate text-[10px] font-bold text-arena">
            Dernière fois : {perf.weight_kg} kg × {perf.reps}
          </p>
        )}
      </div>

      <button
        onClick={onFav}
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-arena-muted active:scale-90"
      >
        <Star size={17} className={fav ? "fill-arena-gold text-arena-gold" : ""} />
      </button>
      {onAdd && (
        <button
          onClick={onAdd}
          aria-label={`Ajouter ${ex.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-arena-gold text-black transition active:scale-90"
        >
          <Plus size={17} strokeWidth={3} />
        </button>
      )}
    </li>
  );
}

function CustomExerciseForm({ onCreated }: { onCreated: (ex: LibraryExercise) => void }) {
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("pectoraux");
  const [equipment, setEquipment] = useState<Equipment>("halteres");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const ex = await createCustomExercise({
      name: name.trim(),
      primary_muscle: primary,
      equipment,
    });
    setSaving(false);
    if (!ex) {
      toast.error("Impossible d'enregistrer. Reconnecte-toi.");
      return;
    }
    setName("");
    onCreated(ex);
  };

  return (
    <div className="border-b border-arena-border bg-arena-surface/50 px-4 py-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de l'exercice"
        className="h-11 w-full rounded-xl border border-arena-border bg-secondary px-3 text-sm text-foreground placeholder:text-arena-muted focus:border-arena focus:outline-none"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="h-11 w-full rounded-xl border border-arena-border bg-secondary px-2 text-sm font-bold text-foreground focus:outline-none"
        >
          {PRIMARY_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as Equipment)}
          className="h-11 w-full rounded-xl border border-arena-border bg-secondary px-2 text-sm font-bold text-foreground focus:outline-none"
        >
          {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((k) => (
            <option key={k} value={k}>
              {EQUIPMENT_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={submit}
        disabled={!name.trim() || saving}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-arena font-black tracking-widest text-arena-on disabled:opacity-40"
      >
        <Check size={15} /> CRÉER
      </button>
    </div>
  );
}
