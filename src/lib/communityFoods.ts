import { supabase } from "@/integrations/supabase/client";
import type { FoodProduct } from "./openFoodFacts";

export type CommunityFood = {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  image_url: string | null;
  kcal_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  serving_size: string | null;
  verified: boolean;
};

/** Cherche un produit par code-barres dans la base communautaire. */
export async function findCommunityByBarcode(barcode: string): Promise<FoodProduct | null> {
  if (!barcode) return null;
  const { data } = await supabase
    .from("community_foods")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  if (!data) return null;
  return toProduct(data as CommunityFood);
}

/** Recherche full-text sommaire par nom. */
export async function searchCommunity(query: string, limit = 20): Promise<FoodProduct[]> {
  const q = query.trim();
  if (!q) return [];
  const { data } = await supabase
    .from("community_foods")
    .select("*")
    .ilike("name", `%${q}%`)
    .limit(limit);
  return ((data as CommunityFood[] | null) ?? []).map(toProduct);
}

/** Upsert best-effort d'un scan/produit dans la base commune (silencieux si conflit). */
export async function upsertCommunityFromProduct(p: FoodProduct): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const n = p.nutriments;
  if (n.energy_kcal_100g == null) return;
  const payload = {
    barcode: p.barcode && !p.barcode.startsWith("photo-") && !p.barcode.startsWith("manual-") ? p.barcode : null,
    name: p.name,
    brand: p.brand ?? null,
    image_url: p.image_url ?? null,
    kcal_100g: Math.max(0, Math.min(2000, Math.round(n.energy_kcal_100g))),
    protein_100g: Math.max(0, Math.min(200, Number(n.proteins_100g ?? 0))),
    carbs_100g: Math.max(0, Math.min(200, Number(n.carbs_100g ?? 0))),
    fat_100g: Math.max(0, Math.min(200, Number(n.fat_100g ?? 0))),
    serving_size: p.serving_size ?? null,
    created_by: auth.user.id,
    verified: true,
  };
  // Upsert par barcode si dispo, sinon insert simple (best effort — on ignore les erreurs de conflit)
  if (payload.barcode) {
    await supabase.from("community_foods").upsert(payload, { onConflict: "barcode", ignoreDuplicates: true });
  } else {
    await supabase.from("community_foods").insert(payload);
  }
}

/** Upsert depuis une saisie manuelle libre (pas de barcode). */
export async function addCommunityManual(entry: {
  name: string;
  quantity_g: number;
  calories: number;
  proteins_g: number;
  carbs_g: number;
  fats_g: number;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const f = 100 / Math.max(1, entry.quantity_g);
  await supabase.from("community_foods").insert({
    name: entry.name,
    kcal_100g: Math.max(0, Math.min(2000, Math.round(entry.calories * f))),
    protein_100g: Math.max(0, Math.min(200, +(entry.proteins_g * f).toFixed(1))),
    carbs_100g: Math.max(0, Math.min(200, +(entry.carbs_g * f).toFixed(1))),
    fat_100g: Math.max(0, Math.min(200, +(entry.fats_g * f).toFixed(1))),
    created_by: auth.user.id,
    verified: false, // saisie manuelle → à modérer
  });
}

function toProduct(c: CommunityFood): FoodProduct {
  return {
    barcode: c.barcode ?? `community-${c.id}`,
    name: c.name,
    brand: c.brand,
    image_url: c.image_url,
    nutriscore: null,
    nova_group: null,
    serving_size: c.serving_size,
    nutriments: {
      energy_kcal_100g: c.kcal_100g,
      proteins_100g: c.protein_100g,
      carbs_100g: c.carbs_100g,
      fat_100g: c.fat_100g,
      sugars_100g: null,
      fiber_100g: null,
      salt_100g: null,
    },
  };
}
