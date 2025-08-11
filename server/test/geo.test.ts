import { expect, test, vi } from 'vitest';
import { searchCommunes } from '../src/services/geo';

const sample = [
  {
    nom: 'Paris',
    code: '75056',
    codesPostaux: ['75001'],
    codeDepartement: '75',
    codeRegion: '11',
    centre: { coordinates: [2.35, 48.85] },
    population: 2000000,
  },
];

vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
  ok: true,
  json: async () => sample,
})) as any);

test('search by name', async () => {
  const res = await searchCommunes('paris');
  expect(res[0].codeInsee).toBe('75056');
});

test('search by postal code', async () => {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => sample })) as any;
  vi.stubGlobal('fetch', fetchMock);
  await searchCommunes('75001');
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('codePostal=75001'));
});
