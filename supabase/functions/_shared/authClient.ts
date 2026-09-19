import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AuthResult = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * Verifies the caller's JWT (Authorization: Bearer <token>) against
 * Supabase Auth and returns an RLS-scoped client (acting as that user)
 * plus their user id. Throws a Response on failure.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Response("Missing Supabase environment variables", { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response("Unauthorized: missing bearer token", { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Response("Unauthorized: empty token", { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Response("Unauthorized: invalid token", { status: 401 });
  }

  return { supabase, userId: data.user.id };
}

/** Service-role client — bypasses RLS. Only use for trusted maintenance writes. */
export function adminClient(): SupabaseClient {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Response("Missing Supabase service role environment variables", { status: 500 });
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
