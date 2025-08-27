import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name} (ajoute-la dans server/.env.local)`);
  return v;
}

/**
 * Crée un client Supabase côté serveur.
 * - Si `jwt` est fourni, on l'injecte en header Authorization pour que les requêtes
 *   soient exécutées avec les RLS de l'utilisateur.
 */
export function getSupabaseForServer(jwt?: string): SupabaseClient {
  const SUPABASE_URL = requireEnv("SUPABASE_URL");
  const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");

  const headers: Record<string, string> = { "X-App-Source": "server" };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers },
  });
}

/** Valide un JWT et renvoie l'id utilisateur. */
export async function getUserFromJWT(jwt: string): Promise<{ userId: string }> {
  if (!jwt) throw new Error("Missing JWT");
  const supabase = getSupabaseForServer();
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) throw new Error(`Invalid token: ${error?.message ?? "no user"}`);
  return { userId: data.user.id };
}
