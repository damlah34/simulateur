import { Pool as PgPool, type PoolConfig } from 'pg';
import { newDb } from 'pg-mem';
import { DATABASE_URL, NODE_ENV } from '../config';

function createRealPool(): PgPool {
  const config: PoolConfig = {};
  if (DATABASE_URL) {
    config.connectionString = DATABASE_URL;
  }
  return new PgPool(config);
}

function createInMemoryPool(): PgPool {
  const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  const adapter = db.adapters.createPg();
  const InMemoryPool = adapter.Pool;
  return new InMemoryPool() as unknown as PgPool;
}

export const pool: PgPool = DATABASE_URL ? createRealPool() : createInMemoryPool();

if (!DATABASE_URL) {
  console.warn("[db] DATABASE_URL manquant, utilisation d'une base en mémoire (pg-mem)");
}

export async function closePool() {
  try {
    await pool.end();
  } catch (error) {
    if (NODE_ENV !== 'production') {
      console.warn('[db] Failed to close pool cleanly:', error);
    }
  }
}
