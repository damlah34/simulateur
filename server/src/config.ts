import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Charge en priorité les secrets locaux du dossier server
dotenv.config({ path: path.resolve(projectRoot, '.env.local') });
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Fallback sur les fichiers à la racine du monorepo
dotenv.config({ path: path.resolve(projectRoot, '..', '.env.local') });
dotenv.config({ path: path.resolve(projectRoot, '..', '.env') });
// Enfin, laisse dotenv regarder les variables déjà définies dans l'environnement
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = Number(process.env.PORT ?? 4000);
export const DATABASE_URL = process.env.DATABASE_URL ?? '';
export const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-prod';
export const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS ?? '3600');

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name} (ajoute ${name} dans server/.env.local)`);
  }
  return value;
}
