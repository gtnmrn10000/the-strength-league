import { z } from "npm:zod@3";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/authClient.ts";

// Coach 100 % déterministe : aucune dépendance à un modèle de langage.


Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { supabase, userId } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // Aucune action IA : le coach est 100 % déterministe (données + règles).



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
