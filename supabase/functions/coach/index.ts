import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/authClient.ts";

const ALL_GROUPS = ["quadriceps","ischios","fessiers","dos","pectoraux","epaules","biceps","triceps","avant_bras","abdos","mollets"];
const RECOVERY_HOURS: Record<string, number> = { quadriceps:72, ischios:72, fessiers:72, dos:48, pectoraux:48, epaules:48, biceps:30, triceps:30, avant_bras:24, abdos:24, mollets:24 };
const MUSCLE_LABEL: Record<string, string> = { quadriceps:"Quadriceps", ischios:"Ischios", fessiers:"Fessiers", dos:"Dos", pectoraux:"Pectoraux", epaules:"Épaules", biceps:"Biceps", triceps:"Triceps", avant_bras:"Avant-bras", abdos:"Abdos", mollets:"Mollets" };

function computeRecovery(sessions: Array<{ muscle_groups: string[] | null; completed_at: string }>) {
  const last: Record<string, string> = {};
  for (const s of sessions) for (const g of s.muscle_groups ?? []) {
    if (!RECOVERY_HOURS[g]) continue;
    if (!last[g] || new Date(s.completed_at) > new Date(last[g])) last[g] = s.completed_at;
  }
  return ALL_GROUPS.map((g) => {
    const total = RECOVERY_HOURS[g];
    const lastAt = last[g] ?? null;
    if (!lastAt) return { group: g, percent: 100, hoursSince: null as number | null };
    const diffH = Math.max(0, (Date.now() - new Date(lastAt).getTime()) / 36e5);
    return { group: g, percent: Math.min(100, Math.round((diffH / total) * 100)), hoursSince: Math.round(diffH) };
  });
}

// deno-lint-ignore no-explicit-any
async function ensurePremium(supabase: any): Promise<any> {
  const { data: premium } = await supabase.rpc("is_current_user_premium");
  if (!premium) throw new Response("PREMIUM_REQUIRED", { status: 402 });
  const { data } = await supabase.rpc("get_my_profile").maybeSingle();
  return data ?? { is_premium: true, pseudo: null, age: null, poids: null, taille: null, sexe: null, niveau_activite: null, goal: null };
}

function callLovableAI(body: unknown) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Response("AI indisponible", { status: 500 });
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
}

// deno-lint-ignore no-explicit-any
function sanitizeWorkout(parsed: any, fallbackFocus: string, fallbackDuration: number) {
  return {
    name: String(parsed?.name ?? "Séance Coach").slice(0, 80),
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
          suggested_weight_kg: typeof e?.suggested_weight_kg === "number" && isFinite(e.suggested_weight_kg) ? Math.max(0, Math.min(500, e.suggested_weight_kg)) : undefined,
          notes: e?.notes ? String(e.notes).slice(0, 200) : undefined,
        }))
      : [],
    scheduled_for: typeof parsed?.scheduled_for === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.scheduled_for) ? parsed.scheduled_for : null,
  };
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { supabase, userId } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "chat") {
      const { message } = z.object({ message: z.string().min(1).max(2000) }).parse(body);
      const profile = await ensurePremium(supabase);

      const since = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
      const { data: sessionsData } = await supabase
        .from("workout_sessions")
        .select("muscle_groups, completed_at, name")
        .eq("user_id", userId)
        .gte("completed_at", since)
        .order("completed_at", { ascending: false });
      const sessions = sessionsData ?? [];
      const recovery = computeRecovery(sessions);
      const recent5 = sessions.slice(0, 5);

      const { data: convData } = await supabase.from("coach_conversations").select("id, messages").eq("user_id", userId).maybeSingle();
      const convMessages = Array.isArray(convData?.messages) ? convData!.messages : [];

      const stats = [
        profile.pseudo ? `pseudo=${profile.pseudo}` : null,
        profile.age ? `âge=${profile.age}` : null,
        profile.sexe ? `sexe=${profile.sexe}` : null,
        profile.taille ? `taille=${profile.taille}cm` : null,
        profile.poids ? `poids=${profile.poids}kg` : null,
        profile.niveau_activite ? `activité=${profile.niveau_activite}` : null,
        profile.goal ? `objectif=${profile.goal}` : null,
      ].filter(Boolean).join(", ");
      const stableSystem = `Tu es le Coach de musculation CENTURIA, expérimenté et bienveillant. Tu tutoies, tu es concis (max 6 phrases sauf demande explicite). Tu refuses fermement toute question sur produits dopants/PED et rediriges vers un médecin pour douleurs/blessures. Tu ne fournis aucune analyse nutritionnelle, recette ou analyse de photo : tu invites l'utilisateur à utiliser le journal nutritionnel manuel.

PROFIL ATHLÈTE (stable): ${stats || "non renseigné"}.

RÈGLES DE COACHING
- Tu tiens compte de l'état de récupération musculaire fourni à chaque tour.
- Un groupe musculaire est "sous-récupéré" si sa récup < 70 %.
- Tu NE proposes PAS d'exercice qui cible un muscle sous-récupéré, sauf si l'utilisateur insiste ou si tu l'avertis EXPLICITEMENT dans "warnings" avec le muscle + le % actuel.
- Groupes musculaires acceptés: ${ALL_GROUPS.join(", ")}. Utilise EXCLUSIVEMENT ces libellés.

PLANIFICATION (IMPORTANT)
- Quand l'utilisateur demande de générer/proposer une séance SANS préciser QUAND, TU NE GÉNÈRES PAS ENCORE la séance. Réponds type="text" avec workout=null et reply = question courte pour savoir quand.
- Quand la date est précisée, génère la séance ET renseigne workout.scheduled_for au format ISO YYYY-MM-DD.
- Si "maintenant"/"démarrons", laisse workout.scheduled_for=null.

FORMAT DE RÉPONSE (obligatoire, JSON strict, aucun texte hors JSON)
{ "type": "text" | "workout", "reply": string, "workout": null OU {...}, "recipe": null, "warnings": string[] }`;

      const undersCovered = recovery.filter((r) => r.percent < 70);
      const recoveryLine = recovery.map((r) => `${MUSCLE_LABEL[r.group]}:${r.percent}%`).join(", ");
      const undersLine = undersCovered.length > 0 ? `Sous-récupérés (<70%): ${undersCovered.map((r) => `${MUSCLE_LABEL[r.group]} ${r.percent}%`).join(", ")}.` : "Aucun groupe sous-récupéré.";
      const sessionsLine = recent5.length > 0 ? `Dernières séances: ${recent5.map((s: any) => `${s.name} [${(s.muscle_groups ?? []).join(",")}] ${new Date(s.completed_at).toLocaleDateString("fr-FR")}`).join(" | ")}.` : "Aucune séance loggée récemment.";

      const now = new Date();
      const dateLine = `Aujourd'hui: ${now.toLocaleDateString("fr-FR", { weekday: "long" })} ${now.toISOString().slice(0, 10)}.`;
      const volatileContext = `${dateLine} Récupération actuelle: ${recoveryLine}. ${undersLine} ${sessionsLine}`.trim();

      const historyForModel = convMessages.slice(-20).map((m: any) => {
        let content = m.content;
        if (m.role === "assistant") {
          if (m.workout) content += `\n[séance générée: ${m.workout.name}]`;
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
          { role: "user", content: message },
        ],
      });
      if (!res.ok) {
        if (res.status === 429) return errorResponse("Trop de requêtes, réessaie plus tard.", 429);
        if (res.status === 402) return errorResponse("Crédits IA épuisés.", 402);
        const t = await res.text().catch(() => "");
        console.error("[coach] gateway error", res.status, t);
        return errorResponse("Coach indisponible", 500);
      }
      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      let parsed: any = null;
      try { parsed = JSON.parse(content); } catch { parsed = { type: "text", reply: content?.toString().trim() || "…", workout: null, recipe: null, warnings: [] }; }

      const type = parsed?.type === "workout" ? "workout" : "text";
      const reply = (parsed?.reply ?? "").toString().trim() || (type === "workout" ? "Voici ta séance." : "…");
      const warnings = Array.isArray(parsed?.warnings) ? parsed.warnings.slice(0, 10).map((w: any) => String(w).slice(0, 200)) : [];
      const workout = type === "workout" && parsed?.workout ? sanitizeWorkout(parsed.workout, "séance", 60) : null;
      const recipe = null;

      const nowIso = new Date().toISOString();
      const newMessages = [...convMessages, { role: "user", content: message, at: nowIso }, { role: "assistant", content: reply, workout, recipe, warnings, at: new Date().toISOString() }];
      await supabase.from("coach_conversations").upsert({ user_id: userId, messages: newMessages.slice(-200), updated_at: new Date().toISOString() }, { onConflict: "user_id" });

      return jsonResponse({ reply, workout, recipe, warnings });
    }

    if (action === "history") {
      const { data } = await supabase.from("coach_conversations").select("messages").eq("user_id", userId).maybeSingle();
      return jsonResponse(Array.isArray(data?.messages) ? data!.messages : []);
    }

    if (action === "clearHistory") {
      await supabase.from("coach_conversations").delete().eq("user_id", userId);
      return jsonResponse({ ok: true });
    }

    if (action === "recovery") {
      const since = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase.from("workout_sessions").select("muscle_groups, completed_at, name").eq("user_id", userId).gte("completed_at", since).order("completed_at", { ascending: false });
      if (error) return errorResponse("Erreur récup", 500);
      return jsonResponse(data ?? []);
    }

    if (action === "weeklyStats") {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [sessionsQ, foodQ, prsQ, profQ] = await Promise.all([
        supabase.from("workout_sessions").select("muscle_groups, duration_min, completed_at").eq("user_id", userId).gte("completed_at", since),
        supabase.from("food_logs").select("calories, proteins_g, carbs_g, fats_g, logged_at").eq("user_id", userId).gte("logged_at", since),
        supabase.from("prs").select("id, created_at, status").eq("user_id", userId).eq("status", "verified").gte("created_at", since),
        supabase.rpc("get_my_profile").maybeSingle(),
      ]);
      const sessions = sessionsQ.data ?? [];
      const by_group: Record<string, number> = {};
      let total_min = 0;
      for (const s of sessions) { total_min += s.duration_min ?? 0; for (const g of s.muscle_groups ?? []) by_group[g] = (by_group[g] ?? 0) + 1; }
      const foods = foodQ.data ?? [];
      const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
      const daysSet = new Set(foods.map((f: any) => dayKey(f.logged_at)));
      const days = Math.max(1, daysSet.size);
      const sums = foods.reduce((a: any, f: any) => ({ kcal: a.kcal + (f.calories ?? 0), prot: a.prot + (f.proteins_g ?? 0), carbs: a.carbs + (f.carbs_g ?? 0), fats: a.fats + (f.fats_g ?? 0) }), { kcal: 0, prot: 0, carbs: 0, fats: 0 });
      const p = profQ.data as any;
      let goals = null;
      if (p?.age && p.poids && p.taille && p.sexe && p.niveau_activite) {
        const activityFactor: Record<string, number> = { sedentaire: 1.2, leger: 1.375, modere: 1.55, intense: 1.725, tres_intense: 1.9 };
        const base = 10 * p.poids + 6.25 * p.taille - 5 * p.age;
        const bmr = p.sexe === "homme" ? base + 5 : base - 161;
        const kcal = Math.round(bmr * (activityFactor[p.niveau_activite] ?? 1.55));
        goals = { kcal, prot: Math.round((kcal * 0.3) / 4), carbs: Math.round((kcal * 0.4) / 4), fats: Math.round((kcal * 0.3) / 9) };
      }
      return jsonResponse({
        sessions: { count: sessions.length, total_min, by_group },
        nutrition: { days: daysSet.size, avg_kcal: Math.round(sums.kcal / days), avg_prot: Math.round(sums.prot / days), avg_carbs: Math.round(sums.carbs / days), avg_fats: Math.round(sums.fats / days), goals },
        prs: { verified_count: (prsQ.data ?? []).length, last_pr_at: p?.last_pr_at ?? null },
      });
    }

    if (action === "saveWorkoutSession") {
      const schema = z.object({
        name: z.string().min(1).max(120),
        duration_min: z.number().int().min(1).max(360).optional(),
        muscle_groups: z.array(z.string()).max(10),
        exercises: z.array(z.any()).max(20),
        notes: z.string().max(1000).optional(),
        mode: z.enum(["start", "schedule"]).default("start"),
        scheduled_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      });
      const data = schema.parse(body);
      const isSchedule = data.mode === "schedule";
      const { data: row, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: userId,
          name: data.name,
          duration_min: data.duration_min ?? null,
          muscle_groups: data.muscle_groups,
          exercises: data.exercises,
          notes: data.notes ?? null,
          completed_at: isSchedule ? null : new Date().toISOString(),
          scheduled_for: isSchedule ? (data.scheduled_for ?? null) : null,
        })
        .select("id, completed_at, scheduled_for")
        .single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse(row);
    }

    return errorResponse("Unknown action", 400);
  } catch (e) {
    if (e instanceof Response) {
      const text = await e.text().catch(() => "Error");
      return errorResponse(text, e.status);
    }
    console.error("[coach] error", e);
    return errorResponse(e instanceof Error ? e.message : "Erreur interne", 500);
  }
});
