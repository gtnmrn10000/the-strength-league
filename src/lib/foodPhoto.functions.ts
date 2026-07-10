import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  image_data_url: z.string().min(20).max(8_000_000),
});

export type FoodPhotoResult = {
  name: string;
  brand: string | null;
  estimated_grams: number;
  nutriments_100g: {
    energy_kcal_100g: number;
    proteins_100g: number;
    carbs_100g: number;
    fat_100g: number;
  };
  confidence: "low" | "medium" | "high";
  notes?: string;
};

export const recognizeFoodPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }): Promise<FoodPhotoResult> => {
    // 1. Gate: subscription check via secure RPC (is_premium is not
    // readable through the public Data API — only through this RPC).
    const { data: isPremium, error: pErr } = await context.supabase.rpc(
      "is_current_user_premium"
    );
    if (pErr) throw new Response("Erreur profil", { status: 500 });
    if (!isPremium) {
      throw new Response("PREMIUM_REQUIRED", { status: 402 });
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Response("AI indisponible", { status: 500 });

    // 2. Call Lovable AI Gateway (vision)
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en nutrition. Identifie l'aliment sur la photo et estime ses valeurs nutritionnelles pour 100g ainsi que la quantité visible en grammes. Réponds STRICTEMENT en JSON avec les clés: name (string, fr), brand (string|null), estimated_grams (number), nutriments_100g {energy_kcal_100g, proteins_100g, carbs_100g, fat_100g} (numbers), confidence ('low'|'medium'|'high'), notes (string, court, fr). Aucune autre clé, aucun texte hors JSON.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyse cet aliment." },
              { type: "image_url", image_url: { url: data.image_data_url } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Response("Trop de requêtes, réessaie plus tard.", { status: 429 });
    if (res.status === 402) throw new Response("Crédits IA épuisés.", { status: 402 });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("[foodPhoto] gateway error", res.status, t);
      throw new Response("Analyse impossible", { status: 500 });
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: FoodPhotoResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Response("Réponse IA invalide", { status: 500 });
    }
    // Basic sanitization
    const n = parsed.nutriments_100g ?? ({} as FoodPhotoResult["nutriments_100g"]);
    return {
      name: String(parsed.name ?? "Aliment").slice(0, 80),
      brand: parsed.brand ? String(parsed.brand).slice(0, 60) : null,
      estimated_grams: Math.max(1, Math.min(2000, Math.round(Number(parsed.estimated_grams) || 100))),
      nutriments_100g: {
        energy_kcal_100g: Math.max(0, Math.min(900, Number(n.energy_kcal_100g) || 0)),
        proteins_100g: Math.max(0, Math.min(100, Number(n.proteins_100g) || 0)),
        carbs_100g: Math.max(0, Math.min(100, Number(n.carbs_100g) || 0)),
        fat_100g: Math.max(0, Math.min(100, Number(n.fat_100g) || 0)),
      },
      confidence: (["low", "medium", "high"].includes(parsed.confidence as string)
        ? parsed.confidence
        : "medium") as FoodPhotoResult["confidence"],
      notes: parsed.notes ? String(parsed.notes).slice(0, 200) : undefined,
    };
  });
