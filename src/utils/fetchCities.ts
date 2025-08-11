export interface CitySuggestion {
  nom: string;
  code: string;
  codePostal: string;
}

export async function fetchCities(query: string): Promise<CitySuggestion[]> {
  const params = new URLSearchParams({ limit: '5', boost: 'population', fields: 'nom,code,codesPostaux' });
  const isPostalCode = /^\d+$/.test(query);
  if (isPostalCode) {
    params.set('codePostal', query);
  } else {
    params.set('nom', query);
  }
  const res = await fetch(`https://geo.api.gouv.fr/communes?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await res.json();
  // data is array of communes, each with nom, code, codesPostaux (array)
  return data.flatMap((commune: { nom: string; code: string; codesPostaux: string[] }) =>
    commune.codesPostaux.map((cp: string) => ({ nom: commune.nom, code: commune.code, codePostal: cp }))
  );
}
