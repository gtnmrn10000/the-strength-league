import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/authClient.ts";

const schema = z.object({ image_data_url: z.string().min(20).max(8_000_000) });

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { supabase } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const data = schema.parse(body);

    const { data: isPremium, error: pErr } = await supabase.rpc("is_current_user_premium");
    if (pErr) return errorResponse("Erreur profil", 500);
    if (!isPremium) return errorResponse("PREMIUM_REQUIRED", 402);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return errorResponse("AI indisponible", 500);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en nutrition. Identifie précisément l'aliment sur la photo et donne ses valeurs nutritionnelles pour 100g (utilise les tables Ciqual / USDA de mémoire).\n\nPour le grammage visible (estimated_grams) : appuie-toi sur des repères d'échelle visibles (main, assiette ~26cm, couverts, verre, emballage) pour estimer. Sois RÉALISTE et VARIÉ selon l'aliment — une banane moyenne pèse ~120g, une pomme ~180g, une tranche de pain ~30g, une portion de riz cuit ~150-200g. N'utilise JAMAIS 100g comme valeur par défaut ; si tu es incertain, propose la portion typique de cet aliment précis. Sans repère d'échelle fiable, passe confidence='low' et mentionne l'incertitude dans notes (fr, court, ex: 'Sans repère d'échelle, ajuste manuellement').\n\nRéponds STRICTEMENT en JSON avec les clés : name (string, fr), brand (string|null), estimated_grams (number, entier, plage 5-1500), nutriments_100g {energy_kcal_100g, proteins_100g, carbs_100g, fat_100g} (numbers), confidence ('low'|'medium'|'high'), notes (string, court, fr). Aucune autre clé, aucun texte hors JSON.",
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

    if (res.status === 429) return errorResponse("Trop de requêtes, réessaie plus tard.", 429);
    if (res.status === 402) return errorResponse("Crédits IA épuisés.", 402);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("[food-photo] gateway error", res.status, t);
      return errorResponse("Analyse impossible", 500);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    // deno-lint-ignore no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return errorResponse("Réponse IA invalide", 500);
    }
    const n = parsed.nutriments_100g ?? {};
    return jsonResponse({
      name: String(parsed.name ?? "Aliment").slice(0, 80),
      brand: parsed.brand ? String(parsed.brand).slice(0, 60) : null,
      estimated_grams: Math.max(1, Math.min(2000, Math.round(Number(parsed.estimated_grams) || 100))),
      nutriments_100g: {
        energy_kcal_100g: Math.max(0, Math.min(900, Number(n.energy_kcal_100g) || 0)),
        proteins_100g: Math.max(0, Math.min(100, Number(n.proteins_100g) || 0)),
        carbs_100g: Math.max(0, Math.min(100, Number(n.carbs_100g) || 0)),
        fat_100g: Math.max(0, Math.min(100, Number(n.fat_100g) || 0)),
      },
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "medium",
      notes: parsed.notes ? String(parsed.notes).slice(0, 200) : undefined,
    });
  } catch (e) {
    if (e instanceof Response) {
      const text = await e.text().catch(() => "Error");
      return errorResponse(text, e.status);
    }
    console.error("[food-photo] error", e);
    return errorResponse(e instanceof Error ? e.message : "Erreur interne", 500);
  }
});
