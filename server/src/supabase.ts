// server/src/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ✅ ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ charge server/.env.local avant d'utiliser process.env
dotenv.config({ path: resolve(__dirname, "../.env.local") });

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name} (ajoute-la dans server/.env.local)`);
  return v;
}

export const SUPABASE_URL = requireEnv("SUPABASE_URL");
export const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");

// ⚠️ Clé service (secrète, côté serveur uniquement)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** Client côté serveur (respecte RLS si tu passes le JWT utilisateur). */
export function getSupabaseForServer(jwt?: string): SupabaseClient {
  const headers: Record<string, string> = { "X-App-Source": "server" };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers },
  });
}

/** Client admin (bypass RLS) — nécessite SUPABASE_SERVICE_ROLE_KEY. */
export function getSupabaseAdmin(): SupabaseClient {
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY; // fallback doux si la clé service manque
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
