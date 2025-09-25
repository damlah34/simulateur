// server/src/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./config";

type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

let cachedConfig: SupabaseConfig | null = null;
let configError: Error | null = null;

function loadConfig() {
  if (cachedConfig || configError) return;
  try {
    cachedConfig = {
      url: requireEnv("SUPABASE_URL"),
      anonKey: requireEnv("SUPABASE_ANON_KEY"),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    };
  } catch (error: any) {
    configError = error instanceof Error ? error : new Error(String(error));
  }
}

function ensureConfig(): SupabaseConfig {
  loadConfig();
  if (!cachedConfig) {
    throw configError ?? new Error("Supabase configuration is missing");
  }
  return cachedConfig;
}

export function getSupabaseForServer(jwt?: string): SupabaseClient {
  const { url, anonKey } = ensureConfig();
  const headers: Record<string, string> = { "X-App-Source": "server" };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = ensureConfig();
  const key = serviceRoleKey || anonKey;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
