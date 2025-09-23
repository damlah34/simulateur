// server/src/config.ts
import path from 'node:path';
import dotenv from 'dotenv';

// 1) Charge d'abord server/.env.local (ton fichier de secrets)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// 2) Puis .env si jamais tu en as un (facultatif, fallback)
dotenv.config();

export const PORT = parseInt(process.env.PORT || '3001', 10);
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
export const TOKEN_TTL_SECONDS = parseInt(process.env.TOKEN_TTL_SECONDS || '3600', 10);
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name} (ajoute ${name} dans server/.env.local)`);
  return v;
}

// ✅ Exports nommés attendus ailleurs dans le code
export const SUPABASE_URL = requireEnv('SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('SUPABASE_ANON_KEY');

// Port de l’API (par défaut 4000)
export const PORT = Number(process.env.PORT ?? 4000);

// Optionnel
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
