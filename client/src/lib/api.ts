export async function searchCommunes(q: string) {
  const res = await fetch(`/api/communes/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('fetch');
  return res.json();
}

export async function getPrices(insee: string) {
  const res = await fetch(`/api/prix-m2?insee=${encodeURIComponent(insee)}`);
  if (!res.ok) throw new Error('fetch');
  return res.json();
}
