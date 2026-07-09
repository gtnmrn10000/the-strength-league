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
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", auth.user.id)
    .gte("logged_at", startOfDayISO())
    .lte("logged_at", endOfDayISO())
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
