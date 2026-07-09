// Open Food Facts API — gratuit, sans clé
// Docs: https://world.openfoodfacts.org/data

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  nutriscore: string | null;
  nova_group: number | null;
  serving_size: string | null;
  nutriments: {
    energy_kcal_100g: number | null;
    proteins_100g: number | null;
    carbs_100g: number | null;
    fat_100g: number | null;
    sugars_100g: number | null;
    fiber_100g: number | null;
    salt_100g: number | null;
  };
}

export async function fetchProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,image_front_url,nutriscore_grade,nova_group,serving_size,nutriments`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur réseau Open Food Facts");
  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;
  const p = json.product;
  const n = p.nutriments ?? {};
  return {
    barcode,
    name: p.product_name || "Produit inconnu",
    brand: p.brands || null,
    image_url: p.image_front_url || null,
    nutriscore: p.nutriscore_grade || null,
    nova_group: p.nova_group ?? null,
    serving_size: p.serving_size || null,
    nutriments: {
      energy_kcal_100g: n["energy-kcal_100g"] ?? null,
      proteins_100g: n.proteins_100g ?? null,
      carbs_100g: n.carbohydrates_100g ?? null,
      fat_100g: n.fat_100g ?? null,
      sugars_100g: n.sugars_100g ?? null,
      fiber_100g: n.fiber_100g ?? null,
      salt_100g: n.salt_100g ?? null,
    },
  };
}

export async function searchProducts(query: string): Promise<FoodProduct[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,image_front_url,nutriscore_grade,nova_group,serving_size,nutriments`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const products = json.products ?? [];
  return products
    .filter((p: any) => p.code && p.product_name)
    .map((p: any) => {
      const n = p.nutriments ?? {};
      return {
        barcode: p.code,
        name: p.product_name,
        brand: p.brands || null,
        image_url: p.image_front_url || null,
        nutriscore: p.nutriscore_grade || null,
        nova_group: p.nova_group ?? null,
        serving_size: p.serving_size || null,
        nutriments: {
          energy_kcal_100g: n["energy-kcal_100g"] ?? null,
          proteins_100g: n.proteins_100g ?? null,
          carbs_100g: n.carbohydrates_100g ?? null,
          fat_100g: n.fat_100g ?? null,
          sugars_100g: n.sugars_100g ?? null,
          fiber_100g: n.fiber_100g ?? null,
          salt_100g: n.salt_100g ?? null,
        },
      };
    });
}
