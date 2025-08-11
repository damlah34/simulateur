export interface CommuneResult {
  nom: string;
  codeInsee: string;
  codesPostaux: string[];
  departement: string;
  region: string;
  lat: number;
  lon: number;
  population: number;
}

interface ApiCommune {
  nom: string;
  code: string;
  codesPostaux: string[];
  codeDepartement: string;
  codeRegion: string;
  centre?: { coordinates: [number, number] };
  population: number;
}

const cache = new Map<string, { data: CommuneResult[]; expires: number }>();
const DAY_MS = 24 * 60 * 60 * 1000;

export async function searchCommunes(q: string): Promise<CommuneResult[]> {
  const key = q.trim().toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  const params = new URLSearchParams({
    limit: '10',
    fields: 'code,codeRegion,codeDepartement,codesPostaux,centre,population,nom',
    boost: 'population',
  });

  if (/^\d{2,5}$/.test(key)) {
    params.set('codePostal', key);
  } else {
    params.set('nom', key);
  }

  const url = `https://geo.api.gouv.fr/communes?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Geo API error');
  }
  const json: ApiCommune[] = await res.json();
  const data: CommuneResult[] = json.map((c) => ({
    nom: c.nom,
    codeInsee: c.code,
    codesPostaux: c.codesPostaux,
    departement: c.codeDepartement,
    region: c.codeRegion,
    lat: c.centre?.coordinates[1] || 0,
    lon: c.centre?.coordinates[0] || 0,
    population: c.population,
  }));

  cache.set(key, { data, expires: now + DAY_MS });
  return data;
}
