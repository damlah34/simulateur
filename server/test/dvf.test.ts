import { expect, test } from 'vitest';
import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import { getPrices } from '../src/services/dvf';

function createPool() {
  const db = newDb();
  db.public.registerFunction({
    name: 'current_date',
    returns: 'date',
    implementation: () => new Date('2024-12-31'),
  });
  const adapter = db.adapters.createPg();
  return { db, pool: new adapter.Pool() };
}

test('compute prices for known commune', async () => {
  const { db, pool } = createPool();
  const init = fs.readFileSync(path.join(__dirname, '../sql/001_init.sql'), 'utf8');
  const sample = fs.readFileSync(path.join(__dirname, '../sql/002_sample.sql'), 'utf8');
  await db.public.none(init);
  await db.public.none(sample);
  const res = await getPrices(pool as any, '75056');
  expect(res.prix_m2_appart).toBe(10000);
  expect(res.prix_m2_maison).toBe(10000);
});

test('filters outliers', async () => {
  const { db, pool } = createPool();
  await db.public.none(`
    CREATE TABLE dvf_raw (
      date_mutation DATE,
      nature_mutation TEXT,
      code_commune VARCHAR(5),
      type_local TEXT,
      surface_reelle_bati NUMERIC,
      valeur_fonciere NUMERIC
    );
    INSERT INTO dvf_raw VALUES
    ('2024-01-01','Vente','00001','Appartement',50,500000),
    ('2024-02-01','Vente','00001','Appartement',50,500000),
    ('2024-03-01','Vente','00001','Appartement',50,500000),
    ('2024-04-01','Vente','00001','Appartement',50,50000000);
  `);
  const res = await getPrices(pool as any, '00001');
  expect(res.prix_m2_appart).toBe(10000);
});

test('insufficient data throws', async () => {
  const { db, pool } = createPool();
  await db.public.none(`
    CREATE TABLE dvf_raw (
      date_mutation DATE,
      nature_mutation TEXT,
      code_commune VARCHAR(5),
      type_local TEXT,
      surface_reelle_bati NUMERIC,
      valeur_fonciere NUMERIC
    );
    INSERT INTO dvf_raw VALUES ('2024-01-01','Vente','00002','Appartement',50,500000);
  `);
  await expect(getPrices(pool as any, '00002')).rejects.toThrow('Échantillon insuffisant');
});
