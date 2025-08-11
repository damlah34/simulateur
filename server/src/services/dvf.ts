import { Pool } from 'pg';

export interface PricesResult {
  insee: string;
  prix_m2_appart: number | null;
  prix_m2_maison: number | null;
  periode_reference: string;
  nb_ventes: { appart: number; maison: number };
  source: string;
  methodo: string;
}

const cache = new Map<string, { data: PricesResult; expires: number }>();
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

async function queryPrices(pool: Pool, insee: string, months: number) {
  const { rows } = await pool.query(
    `
WITH base AS (
  SELECT
    type_local,
    valeur_fonciere / NULLIF(surface_reelle_bati,0) AS prix_m2,
    date_mutation
  FROM dvf_raw
  WHERE code_commune = $1
    AND nature_mutation = 'Vente'
    AND type_local IN ('Appartement','Maison')
    AND surface_reelle_bati BETWEEN 10 AND 300
    AND date_mutation >= (CURRENT_DATE - INTERVAL '${months} months')
    AND date_mutation <= CURRENT_DATE
),
limits AS (
  SELECT type_local,
    percentile_cont(0.05) WITHIN GROUP (ORDER BY prix_m2) AS p5,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY prix_m2) AS p95
  FROM base
  WHERE prix_m2 IS NOT NULL
  GROUP BY type_local
),
trimmed AS (
  SELECT b.*
  FROM base b
  JOIN limits l ON b.type_local = l.type_local
  WHERE b.prix_m2 BETWEEN l.p5 AND l.p95
)
SELECT
  type_local,
  COUNT(*) AS nb_ventes,
  ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY prix_m2))::int AS median
FROM trimmed
GROUP BY type_local;
    `,
    [insee],
  );
  return rows;
}

export async function getPrices(pool: Pool, insee: string): Promise<PricesResult> {
  const now = Date.now();
  const key = insee;
  const cached = cache.get(key);
  if (cached && cached.expires > now) return cached.data;

  let months = 24;
  let rows = await queryPrices(pool, insee, months);
  let total = rows.reduce((s, r) => s + Number(r.nb_ventes), 0);
  if (total < 15) {
    months = 36;
    rows = await queryPrices(pool, insee, months);
    total = rows.reduce((s, r) => s + Number(r.nb_ventes), 0);
    if (total < 15) {
      throw new Error('Échantillon insuffisant');
    }
  }

  const appart = rows.find((r) => r.type_local === 'Appartement');
  const maison = rows.find((r) => r.type_local === 'Maison');

  const end = new Date();
  const endMonth = end.toISOString().slice(0, 7);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months + 1);
  const startMonth = start.toISOString().slice(0, 7);

  const result: PricesResult = {
    insee,
    prix_m2_appart: appart ? Number(appart.median) : null,
    prix_m2_maison: maison ? Number(maison.median) : null,
    periode_reference: `${startMonth} à ${endMonth} (${months} mois)`,
    nb_ventes: {
      appart: appart ? Number(appart.nb_ventes) : 0,
      maison: maison ? Number(maison.nb_ventes) : 0,
    },
    source: 'DVF',
    methodo: 'Médiane, P5–P95, 10–300 m²',
  };

  cache.set(key, { data: result, expires: now + 30 * MONTH_MS });
  return result;
}
