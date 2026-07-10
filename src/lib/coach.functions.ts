import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeRecovery, MUSCLE_LABEL, ALL_GROUPS, type MuscleGroup } from "@/lib/recovery";

// ---------- Types ----------
export type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_s: number;
  muscle_groups: string[];
  suggested_weight_kg?: number;
  notes?: string;
};

export type GeneratedWorkout = {
  name: string;
  duration_min: number;
  focus: string;
  muscle_groups: string[];
  warmup: string;
  exercises: GeneratedExercise[];
  cooldown: string;
};

export type GeneratedRecipe = {
  name: string;
  prep_min: number;
  kcal: number;
  prot_g: number;
  carbs_g: number;
  fats_g: number;
  ingredients: Array<{ name: string; qty: string }>;
  steps: string[];
};

export type AssistantContent = {
  reply: string;
  workout?: GeneratedWorkout | null;
  recipe?: GeneratedRecipe | null;
  warnings?: string[];
};

export type ChatMsg =
  | { role: "user"; content: string; at?: string }
  | {
      role: "assistant";
      content: string;
      workout?: GeneratedWorkout | null;
      recipe?: GeneratedRecipe | null;
      warnings?: string[];
      at?: string;
    };

// ---------- Helpers ----------
type ProfileCtx = {
  is_premium: boolean | null;
  pseudo: string | null;
  age: number | null;
  poids: number | null;
  taille: number | null;
  sexe: string | null;
  niveau_activite: string | null;
  goal: string | null;
};

async function ensurePremium(supabase: any, userId: string): Promise<ProfileCtx> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium, pseudo, age, poids, taille, sexe, niveau_activite, goal")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Response("Erreur profil", { status: 500 });
  if (!data?.is_premium) throw new Response("PREMIUM_REQUIRED", { status: 402 });
  return data as ProfileCtx;
}

function callLovableAI(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Response("AI indisponible", { status: 500 });
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
}

async function readGatewayError(res: Response): Promise<never> {
  if (res.status === 429) throw new Response("Trop de requêtes, réessaie plus tard.", { status: 429 });
  if (res.status === 402) throw new Response("Crédits IA épuisés.", { status: 402 });
  const t = await res.text().catch(() => "");
  console.error("[coach] gateway error", res.status, t);
  throw new Response("Coach indisponible", { status: 500 });
}

async function loadRecoverySnapshot(supabase: any, userId: string) {
  const since = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("workout_sessions")
    .select("muscle_groups, completed_at, name")
    .eq("user_id", userId)
    .gte("completed_at", since)
    .order("completed_at", { ascending: false });
  const sessions = (data ?? []) as Array<{ muscle_groups: string[]; completed_at: string; name: string }>;
  const recovery = computeRecovery(sessions);
  const recent5 = sessions.slice(0, 5);
  return { recovery, recent5 };
}

function sanitizeWorkout(parsed: any, fallbackFocus: string, fallbackDuration: number): GeneratedWorkout {
  return {
    name: String(parsed?.name ?? "Séance Coach IA").slice(0, 80),
    duration_min: Math.max(15, Math.min(180, Number(parsed?.duration_min) || fallbackDuration)),
    focus: String(parsed?.focus ?? fallbackFocus).slice(0, 80),
    muscle_groups: Array.isArray(parsed?.muscle_groups) ? parsed.muscle_groups.slice(0, 10).map(String) : [],
    warmup: String(parsed?.warmup ?? "").slice(0, 400),
    cooldown: String(parsed?.cooldown ?? "").slice(0, 400),
    exercises: Array.isArray(parsed?.exercises)
      ? parsed.exercises.slice(0, 12).map((e: any) => ({
          name: String(e?.name ?? "Exercice").slice(0, 60),
          sets: Math.max(1, Math.min(10, Number(e?.sets) || 3)),
          reps: String(e?.reps ?? "8-12").slice(0, 20),
          rest_s: Math.max(15, Math.min(600, Number(e?.rest_s) || 90)),
          muscle_groups: Array.isArray(e?.muscle_groups) ? e.muscle_groups.slice(0, 5).map(String) : [],
          suggested_weight_kg:
            typeof e?.suggested_weight_kg === "number" && isFinite(e.suggested_weight_kg)
              ? Math.max(0, Math.min(500, e.suggested_weight_kg))
              : undefined,
          notes: e?.notes ? String(e.notes).slice(0, 200) : undefined,
        }))
      : [],
  };
}

function sanitizeRecipe(parsed: any): GeneratedRecipe {
  return {
    name: String(parsed?.name ?? "Recette Coach").slice(0, 80),
    prep_min: Math.max(1, Math.min(240, Number(parsed?.prep_min) || 15)),
    kcal: Math.max(0, Math.min(4000, Math.round(Number(parsed?.kcal) || 0))),
    prot_g: Math.max(0, Math.min(400, Math.round(Number(parsed?.prot_g) || 0))),
    carbs_g: Math.max(0, Math.min(600, Math.round(Number(parsed?.carbs_g) || 0))),
    fats_g: Math.max(0, Math.min(300, Math.round(Number(parsed?.fats_g) || 0))),
    ingredients: Array.isArray(parsed?.ingredients)
      ? parsed.ingredients.slice(0, 20).map((i: any) => ({
          name: String(i?.name ?? "").slice(0, 60),
          qty: String(i?.qty ?? "").slice(0, 40),
        })).filter((i: any) => i.name)
      : [],
    steps: Array.isArray(parsed?.steps)
      ? parsed.steps.slice(0, 12).map((s: any) => String(s).slice(0, 300)).filter(Boolean)
      : [],
  };
}

async function loadTodayNutrition(supabase: any, userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("food_logs")
    .select("product_name, calories, proteins_g, carbs_g, fats_g")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString())
    .order("logged_at", { ascending: false });
  const logs = (data ?? []) as Array<{ product_name: string; calories: number; proteins_g: number; carbs_g: number; fats_g: number }>;
  const totals = logs.reduce(
    (acc, l) => ({
      kcal: acc.kcal + (l.calories ?? 0),
      prot: acc.prot + (l.proteins_g ?? 0),
      carbs: acc.carbs + (l.carbs_g ?? 0),
      fats: acc.fats + (l.fats_g ?? 0),
    }),
    { kcal: 0, prot: 0, carbs: 0, fats: 0 },
  );
  return { logs, totals };
}

// ---------- System prompt (bloc stable, cache-friendly) ----------
function buildStableSystemPrompt(profile: ProfileCtx): string {
  const stats = [
    profile.pseudo ? `pseudo=${profile.pseudo}` : null,
    profile.age ? `âge=${profile.age}` : null,
    profile.sexe ? `sexe=${profile.sexe}` : null,
    profile.taille ? `taille=${profile.taille}cm` : null,
    profile.poids ? `poids=${profile.poids}kg` : null,
    profile.niveau_activite ? `activité=${profile.niveau_activite}` : null,
    profile.goal ? `objectif=${profile.goal}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const groupsList = ALL_GROUPS.map((g) => g).join(", ");

  return `Tu es Coach IA, un coach de musculation FR expérimenté et bienveillant. Tu tutoies, tu es concis (max 6 phrases sauf demande explicite). Tu refuses fermement toute question sur produits dopants/PED et rediriges vers un médecin pour douleurs/blessures.

PROFIL ATHLÈTE (stable): ${stats || "non renseigné"}.

RÈGLES DE COACHING
- Tu tiens compte de l'état de récupération musculaire fourni à chaque tour.
- Un groupe musculaire est "sous-récupéré" si sa récup < 70 %.
- Tu NE proposes PAS d'exercice qui cible un muscle sous-récupéré, sauf si l'utilisateur insiste ou si tu l'avertis EXPLICITEMENT dans "warnings" avec le muscle + le % actuel.
- Groupes musculaires acceptés: ${groupsList}. Utilise EXCLUSIVEMENT ces libellés (jamais "jambes" seul, découpe en quadriceps/ischios/fessiers).

FORMAT DE RÉPONSE (obligatoire, JSON strict, aucun texte hors JSON)
{
  "type": "text" | "workout" | "recipe",
  "reply": "réponse conversationnelle en français, toujours présente",
  "workout": null OU {
    "name": string,
    "duration_min": number,
    "focus": string,
    "muscle_groups": string[],
    "warmup": string,
    "exercises": [{ "name": string, "sets": number, "reps": string, "rest_s": number, "muscle_groups": string[], "suggested_weight_kg"?: number, "notes"?: string }],
    "cooldown": string
  },
  "recipe": null OU {
    "name": string,
    "prep_min": number,
    "kcal": number,
    "prot_g": number,
    "carbs_g": number,
    "fats_g": number,
    "ingredients": [{ "name": string, "qty": string }],
    "steps": string[]
  },
  "warnings": string[]
}

- "type" = "workout" UNIQUEMENT si tu proposes une séance complète actionnable. "type" = "recipe" UNIQUEMENT si tu proposes une recette actionnable adaptée aux macros restantes de la journée. Sinon "text" et workout=recipe=null.
- Les recettes doivent viser en priorité à combler les macros restantes du jour (fournies dans le contexte volatile). Reste réaliste (ingrédients simples, dispo en supermarché FR, portions cohérentes).
- "reply" est TOUJOURS une phrase conversationnelle courte, même quand tu retournes une séance/recette ("Voilà ta séance push, prêt ?" / "Tiens, une recette qui rentre pile dans tes macros restantes.").
- "warnings" liste les muscles sous-récupérés que tu sollicites quand même, format "quadriceps à 42 % — attends encore ~15 h idéalement".`;
}

// ---------- Chat principal ----------
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

async function loadOrInitConversation(supabase: any, userId: string): Promise<{ id: string | null; messages: ChatMsg[] }> {
  const { data } = await supabase
    .from("coach_conversations")
    .select("id, messages")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { id: null, messages: [] };
  const msgs = Array.isArray(data.messages) ? (data.messages as ChatMsg[]) : [];
  return { id: data.id as string, messages: msgs };
}

async function saveConversation(supabase: any, userId: string, messages: ChatMsg[]) {
  const { error } = await supabase
    .from("coach_conversations")
    .upsert(
      { user_id: userId, messages, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) console.error("[coach] save conversation error", error);
}

export const coachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => chatSchema.parse(d))
  .handler(async ({ data, context }): Promise<AssistantContent> => {
    const profile = await ensurePremium(context.supabase, context.userId);
    const [{ recovery, recent5 }, conv, nutrition] = await Promise.all([
      loadRecoverySnapshot(context.supabase, context.userId),
      loadOrInitConversation(context.supabase, context.userId),
      loadTodayNutrition(context.supabase, context.userId),
    ]);

    // Contexte volatile injecté juste avant le message utilisateur
    const recoveryLine = recovery
      .map((r) => `${MUSCLE_LABEL[r.group]}:${r.percent}%`)
      .join(", ");
    const undersCovered = recovery.filter((r) => r.percent < 70);
    const undersLine =
      undersCovered.length > 0
        ? `Sous-récupérés (<70%): ${undersCovered.map((r) => `${MUSCLE_LABEL[r.group]} ${r.percent}%`).join(", ")}.`
        : "Aucun groupe sous-récupéré.";
    const sessionsLine =
      recent5.length > 0
        ? `Dernières séances: ${recent5
            .map((s) => `${s.name} [${(s.muscle_groups ?? []).join(",")}] ${new Date(s.completed_at).toLocaleDateString("fr-FR")}`)
            .join(" | ")}.`
        : "Aucune séance loggée récemment.";

    // Objectifs macros (Mifflin-St Jeor split 30/40/30) — reproduit ici côté serveur pour éviter un import client.
    let goalsLine = "Objectifs macros: non calculables (profil incomplet).";
    let remainingLine = "";
    if (profile.age && profile.poids && profile.taille && profile.sexe && profile.niveau_activite) {
      const activityFactor: Record<string, number> = {
        sedentaire: 1.2, leger: 1.375, modere: 1.55, intense: 1.725, tres_intense: 1.9,
      };
      const base = 10 * profile.poids + 6.25 * profile.taille - 5 * profile.age;
      const bmr = profile.sexe === "homme" ? base + 5 : base - 161;
      const kcalGoal = Math.round(bmr * (activityFactor[profile.niveau_activite] ?? 1.55));
      const protGoal = Math.round((kcalGoal * 0.3) / 4);
      const carbsGoal = Math.round((kcalGoal * 0.4) / 4);
      const fatGoal = Math.round((kcalGoal * 0.3) / 9);
      goalsLine = `Objectifs jour: ${kcalGoal}kcal / ${protGoal}g prot / ${carbsGoal}g gluc / ${fatGoal}g lip.`;
      const remKcal = Math.max(0, kcalGoal - Math.round(nutrition.totals.kcal));
      const remProt = Math.max(0, protGoal - Math.round(nutrition.totals.prot));
      const remCarbs = Math.max(0, carbsGoal - Math.round(nutrition.totals.carbs));
      const remFat = Math.max(0, fatGoal - Math.round(nutrition.totals.fats));
      remainingLine = `Restant à couvrir aujourd'hui: ${remKcal}kcal / ${remProt}g prot / ${remCarbs}g gluc / ${remFat}g lip.`;
    }
    const consumedLine = `Consommé aujourd'hui: ${Math.round(nutrition.totals.kcal)}kcal / ${Math.round(nutrition.totals.prot)}g prot / ${Math.round(nutrition.totals.carbs)}g gluc / ${Math.round(nutrition.totals.fats)}g lip (${nutrition.logs.length} entrée${nutrition.logs.length > 1 ? "s" : ""}).`;

    const stableSystem = buildStableSystemPrompt(profile);
    const volatileContext = `Récupération actuelle: ${recoveryLine}. ${undersLine} ${sessionsLine} ${goalsLine} ${consumedLine} ${remainingLine}`.trim();

    // On ne renvoie que le contenu texte des tours précédents pour garder le contexte léger.
    const historyForModel = conv.messages.slice(-20).map((m) => {
      let content = m.content;
      if (m.role === "assistant") {
        if (m.workout) content += `\n[séance générée: ${m.workout.name}]`;
        if (m.recipe) content += `\n[recette générée: ${m.recipe.name}]`;
      }
      return { role: m.role, content };
    });

    const res = await callLovableAI({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: stableSystem },
        ...historyForModel,
        { role: "system", content: volatileContext },
        { role: "user", content: data.message },
      ],
    });
    if (!res.ok) await readGatewayError(res);
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { type: "text", reply: content?.toString().trim() || "…", workout: null, recipe: null, warnings: [] };
    }

    const type = parsed?.type === "workout" ? "workout" : parsed?.type === "recipe" ? "recipe" : "text";
    const reply: string =
      (parsed?.reply ?? "").toString().trim() ||
      (type === "workout" ? "Voici ta séance." : type === "recipe" ? "Voici une recette adaptée." : "…");
    const warnings: string[] = Array.isArray(parsed?.warnings)
      ? parsed.warnings.slice(0, 10).map((w: any) => String(w).slice(0, 200))
      : [];
    const workout = type === "workout" && parsed?.workout ? sanitizeWorkout(parsed.workout, "séance", 60) : null;
    const recipe = type === "recipe" && parsed?.recipe ? sanitizeRecipe(parsed.recipe) : null;

    const nowIso = new Date().toISOString();
    const newMessages: ChatMsg[] = [
      ...conv.messages,
      { role: "user", content: data.message, at: nowIso },
      { role: "assistant", content: reply, workout, recipe, warnings, at: new Date().toISOString() },
    ];
    const trimmed = newMessages.slice(-200);
    await saveConversation(context.supabase, context.userId, trimmed);

    return { reply, workout, recipe, warnings };
  });

// ---------- Historique ----------
export const getCoachHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatMsg[]> => {
    const conv = await loadOrInitConversation(context.supabase, context.userId);
    return conv.messages;
  });

export const clearCoachHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("coach_conversations").delete().eq("user_id", context.userId);
    return { ok: true };
  });

// ---------- Sauvegarde d'une séance ----------
const saveSchema = z.object({
  name: z.string().min(1).max(120),
  duration_min: z.number().int().min(1).max(360).optional(),
  muscle_groups: z.array(z.string()).max(10),
  exercises: z.array(z.any()).max(20),
  notes: z.string().max(1000).optional(),
});

export const saveWorkoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("workout_sessions")
      .insert({
        user_id: context.userId,
        name: data.name,
        duration_min: data.duration_min ?? null,
        muscle_groups: data.muscle_groups,
        exercises: data.exercises,
        notes: data.notes ?? null,
        completed_at: new Date().toISOString(),
      })
      .select("id, completed_at")
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    return row;
  });

// ---------- Récup pour widget ----------
export const getRecentMuscleWork = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("workout_sessions")
      .select("muscle_groups, completed_at, name")
      .eq("user_id", context.userId)
      .gte("completed_at", since)
      .order("completed_at", { ascending: false });
    if (error) throw new Response("Erreur récup", { status: 500 });
    return (data ?? []) as Array<{ muscle_groups: string[]; completed_at: string; name: string }>;
  });
