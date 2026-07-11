import { supabase } from "@/integrations/supabase/client";
import type { FoodProduct } from "./openFoodFacts";

export type FoodSource = "barcode" | "photo" | "manual";

export type FoodLog = {
  id: string;
  user_id: string;
  source: FoodSource;
  product_name: string;
  barcode: string | null;
  quantity_g: number;
  calories: number;
  proteins_g: number;
  carbs_g: number;
  fats_g: number;
  logged_at: string;
  created_at: string;
};

function startOfDayISO(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s.toISOString();
}
function endOfDayISO(d = new Date()) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e.toISOString();
}

export async function fetchTodayLogs(): Promise<FoodLog[]> {
  return fetchLogsForDate(new Date());
}

export async function fetchLogsForDate(date: Date): Promise<FoodLog[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", auth.user.id)
    .gte("logged_at", startOfDayISO(date))
    .lte("logged_at", endOfDayISO(date))
    .order("logged_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FoodLog[];
}

export async function addFoodLogFromProduct(
  product: FoodProduct,
  grams: number,
  source: FoodSource,
): Promise<FoodLog> {
  const f = grams / 100;
  const n = product.nutriments;
  return addFoodLog({
    source,
    product_name: product.name,
    barcode: product.barcode ?? null,
    quantity_g: grams,
    calories: Math.round((n.energy_kcal_100g ?? 0) * f),
    proteins_g: +(((n.proteins_100g ?? 0) * f)).toFixed(1),
    carbs_g: +(((n.carbs_100g ?? 0) * f)).toFixed(1),
    fats_g: +(((n.fat_100g ?? 0) * f)).toFixed(1),
  });
}

export async function addFoodLog(entry: {
  source: FoodSource;
  product_name: string;
  barcode?: string | null;
  quantity_g: number;
  calories: number;
  proteins_g: number;
  carbs_g: number;
  fats_g: number;
}): Promise<FoodLog> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Non connecté");
  const { data, error } = await supabase
    .from("food_logs")
    .insert({
      user_id: auth.user.id,
      source: entry.source,
      product_name: entry.product_name,
      barcode: entry.barcode ?? null,
      quantity_g: entry.quantity_g,
      calories: entry.calories,
      proteins_g: entry.proteins_g,
      carbs_g: entry.carbs_g,
      fats_g: entry.fats_g,
      logged_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as FoodLog;
}

export async function deleteFoodLog(id: string) {
  const { error } = await supabase.from("food_logs").delete().eq("id", id);
  if (error) throw error;
}

export type NutritionStreak = {
  /** Nombre de mois consécutifs (mois courant inclus s'il est encore valide) sans dépasser 5 jours ratés. */
  months: number;
  /** Jours loggés sur le mois courant. */
  daysLoggedThisMonth: number;
  /** Jours ratés sur le mois courant (jusqu'à aujourd'hui). */
  missedThisMonth: number;
  /** Jours ratés max autorisés avant de casser le streak (5). */
  tolerance: number;
  /** True tant que le mois courant reste dans la tolérance. */
  currentMonthValid: boolean;
};

/**
 * Calcule un streak mensuel de régularité alimentaire :
 * un mois compte s'il n'a pas plus de 5 jours "non loggés" (aucun food_log).
 * Le mois courant est comptabilisé jusqu'à aujourd'hui seulement.
 */
export async function fetchNutritionStreak(): Promise<NutritionStreak> {
  const tolerance = 5;
  const empty: NutritionStreak = {
    months: 0,
    daysLoggedThisMonth: 0,
    missedThisMonth: 0,
    tolerance,
    currentMonthValid: false,
  };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return empty;

  // Regarde jusqu'à 12 mois d'historique.
  const since = new Date();
  since.setMonth(since.getMonth() - 12);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("food_logs")
    .select("logged_at")
    .eq("user_id", auth.user.id)
    .gte("logged_at", since.toISOString());
  if (error || !data) return empty;

  // Regroupe les jours loggés par clé mois "YYYY-MM" -> Set<jour>.
  const byMonth = new Map<string, Set<number>>();
  for (const row of data as Array<{ logged_at: string }>) {
    const d = new Date(row.logged_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, new Set());
    byMonth.get(key)!.add(d.getDate());
  }

  const today = new Date();
  const missedForMonth = (year: number, month0: number, upToDay?: number) => {
    const key = `${year}-${String(month0 + 1).padStart(2, "0")}`;
    const daysInMonth = upToDay ?? new Date(year, month0 + 1, 0).getDate();
    const logged = byMonth.get(key)?.size ?? 0;
    return { missed: Math.max(0, daysInMonth - logged), daysInMonth, logged };
  };

  // Mois courant, comptabilisé jusqu'à aujourd'hui.
  const cur = missedForMonth(today.getFullYear(), today.getMonth(), today.getDate());
  const currentMonthValid = cur.missed <= tolerance;

  let months = currentMonthValid ? 1 : 0;
  // Remonte mois par mois.
  const cursor = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  for (let i = 0; i < 12; i++) {
    const info = missedForMonth(cursor.getFullYear(), cursor.getMonth());
    if (info.missed <= tolerance && info.logged > 0) months += 1;
    else break;
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return {
    months,
    daysLoggedThisMonth: cur.logged,
    missedThisMonth: cur.missed,
    tolerance,
    currentMonthValid,
  };
}

