interface DVFRecord {
  fields: {
    date_mutation?: string;
    type_local?: string;
    surface_reelle_bati?: number;
    valeur_fonciere?: number;
  };
}

export async function fetchCityPrice(cityCode: string): Promise<number> {
  const params = new URLSearchParams();
  params.set('dataset', 'demandes-de-valeurs-foncieres');
  // API maximum allowed rows is 1000 per request
  params.set('rows', '1000');
  params.set('refine.code_commune', cityCode);
  params.set('refine.nature_mutation', 'Vente');

  let start = 0;
  const allRecords: DVFRecord[] = [];
  while (true) {
    params.set('start', start.toString());
    const url = `https://data.economie.gouv.fr/api/records/1.0/search/?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`DVF API ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const records: DVFRecord[] = (data.records as DVFRecord[]) || [];
    allRecords.push(...records);
    if (records.length < 1000) {
      break;
    }
    start += records.length;
  }
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setMonth(now.getMonth() - 24);

  const prices: number[] = allRecords
    .map((record) => record.fields)
    .filter((f) => {
      const date = f.date_mutation ? new Date(f.date_mutation) : null;
      return (
        date &&
        date >= twoYearsAgo &&
        date <= now &&
        (f.type_local === 'Appartement' || f.type_local === 'Maison') &&
        typeof f.surface_reelle_bati === 'number' &&
        f.surface_reelle_bati >= 10 &&
        f.surface_reelle_bati <= 300 &&
        typeof f.valeur_fonciere === 'number'
      );
    })
    .map(
      (f) => (f.valeur_fonciere as number) / (f.surface_reelle_bati as number),
    );

  if (prices.length === 0) {
    throw new Error('No transactions found');
  }

  prices.sort((a, b) => a - b);
  const lower = Math.floor(prices.length * 0.05);
  const upper = Math.ceil(prices.length * 0.95) - 1;
  const trimmed = prices.slice(lower, upper + 1);

  if (trimmed.length === 0) {
    throw new Error('No data after trimming');
  }

  const mid = Math.floor(trimmed.length / 2);
  const median =
    trimmed.length % 2 !== 0
      ? trimmed[mid]
      : (trimmed[mid - 1] + trimmed[mid]) / 2;

  return median;
}
