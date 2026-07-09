import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Types ----------
export type ChatMsg = { role: "user" | "assistant"; content: string };

export type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_s: number;
  muscle_groups: string[];
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

// ---------- Helpers ----------
async function ensurePremium(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium, pseudo, age, poids, taille, sexe, niveau_activite, goal")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Response("Erreur profil", { status: 500 });
  if (!data?.is_premium) throw new Response("PREMIUM_REQUIRED", { status: 402 });
  return data;
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

// ---------- Chat ----------
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const coachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => chatSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ reply: string }> => {
    const profile = await ensurePremium(context.supabase, context.userId);

    // Contexte : historique récent (30 derniers messages) + dernières séances
    const [{ data: history }, { data: recent }] = await Promise.all([
      context.supabase
        .from("coach_conversations")
        .select("role, content")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase
        .from("workout_sessions")
        .select("name, muscle_groups, completed_at")
        .eq("user_id", context.userId)
        .order("completed_at", { ascending: false })
        .limit(5),
    ]);

    const historyMsgs = (history ?? []).reverse().map((m: any) => ({ role: m.role, content: m.content }));

    const goals = profile?.goal ?? "non défini";
    const stats = `Pseudo: ${profile?.pseudo ?? "?"}, âge: ${profile?.age ?? "?"}, poids: ${profile?.poids ?? "?"}kg, taille: ${profile?.taille ?? "?"}cm, sexe: ${profile?.sexe ?? "?"}, niveau: ${profile?.niveau_activite ?? "?"}, objectif: ${goals}.`;
    const sessionsCtx =
      (recent ?? []).length > 0
        ? `Dernières séances: ${(recent ?? [])
            .map((s: any) => `${s.name} (${(s.muscle_groups ?? []).join(",")}) le ${new Date(s.completed_at).toLocaleDateString("fr-FR")}`)
            .join(" | ")}.`
        : "Aucune séance loggée récemment.";

    const system = `Tu es Coach IA, un coach de musculation expérimenté et bienveillant. Tu réponds en français, en tutoyant, de manière concise (max 6 phrases sauf demande explicite). Tu conseilles sur la programmation, la technique, la récupération et la nutrition. Tu es prudent : refuse toute demande sur des produits dopants/PED, oriente vers un médecin pour douleurs/blessures. Contexte utilisateur — ${stats} ${sessionsCtx}`;

    const res = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        ...historyMsgs,
        { role: "user", content: data.message },
      ],
    });
    if (!res.ok) await readGatewayError(res);
    const json = await res.json();
    const reply: string = (json?.choices?.[0]?.message?.content ?? "").toString().trim();
    if (!reply) throw new Response("Réponse vide", { status: 500 });

    // Persist
    await context.supabase.from("coach_conversations").insert([
      { user_id: context.userId, role: "user", content: data.message },
      { user_id: context.userId, role: "assistant", content: reply },
    ]);

    return { reply };
  });

// ---------- Historique chat ----------
export const getCoachHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatMsg[]> => {
    const { data, error } = await context.supabase
      .from("coach_conversations")
      .select("role, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Response("Erreur historique", { status: 500 });
    return (data ?? []).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));
  });

export const clearCoachHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("coach_conversations").delete().eq("user_id", context.userId);
    return { ok: true };
  });

// ---------- Génération de séance ----------
const genSchema = z.object({
  focus: z.string().min(1).max(80), // ex. "pecs+triceps", "full body", "jambes"
  duration_min: z.number().int().min(15).max(180),
  equipment: z.string().max(200).optional(),
  freshGroups: z.array(z.string()).max(20).optional(),
});

export const generateWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => genSchema.parse(d))
  .handler(async ({ data, context }): Promise<GeneratedWorkout> => {
    const profile = await ensurePremium(context.supabase, context.userId);

    const level = profile?.goal ?? "performance";
    const fresh = data.freshGroups?.length ? `Groupes frais dispos: ${data.freshGroups.join(", ")}.` : "";
    const eq = data.equipment ? `Matériel: ${data.equipment}.` : "Matériel standard salle de sport.";

    const system = `Tu es un coach expert. Génère une séance de musculation adaptée. Réponds STRICTEMENT en JSON, sans texte hors JSON, avec les clés exactes: name (string), duration_min (number), focus (string), muscle_groups (string[] parmi: pectoraux, dos, jambes, epaules, biceps, triceps, abdos, fessiers, mollets, avant_bras), warmup (string court), exercises (array de {name, sets:number, reps:string, rest_s:number, muscle_groups:string[], notes?:string}), cooldown (string court). 5 à 8 exercices maximum. Adapte la charge/reps au niveau. ${eq} ${fresh}`;

    const user = `Focus: ${data.focus}. Durée cible: ${data.duration_min} min. Objectif de l'athlète: ${level}.`;

    const res = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    if (!res.ok) await readGatewayError(res);
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: GeneratedWorkout;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Response("Réponse IA invalide", { status: 500 });
    }

    // Sanitize
    const clean: GeneratedWorkout = {
      name: String(parsed.name ?? "Séance Coach IA").slice(0, 80),
      duration_min: Math.max(15, Math.min(180, Number(parsed.duration_min) || data.duration_min)),
      focus: String(parsed.focus ?? data.focus).slice(0, 80),
      muscle_groups: Array.isArray(parsed.muscle_groups) ? parsed.muscle_groups.slice(0, 10).map(String) : [],
      warmup: String(parsed.warmup ?? "").slice(0, 400),
      cooldown: String(parsed.cooldown ?? "").slice(0, 400),
      exercises: Array.isArray(parsed.exercises)
        ? parsed.exercises.slice(0, 10).map((e: any) => ({
            name: String(e?.name ?? "Exercice").slice(0, 60),
            sets: Math.max(1, Math.min(10, Number(e?.sets) || 3)),
            reps: String(e?.reps ?? "8-12").slice(0, 20),
            rest_s: Math.max(15, Math.min(600, Number(e?.rest_s) || 90)),
            muscle_groups: Array.isArray(e?.muscle_groups) ? e.muscle_groups.slice(0, 5).map(String) : [],
            notes: e?.notes ? String(e.notes).slice(0, 200) : undefined,
          }))
        : [],
    };
    return clean;
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

// ---------- Récupération musculaire ----------
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
