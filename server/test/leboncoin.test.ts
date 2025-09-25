import { expect, test, vi } from 'vitest';
import { fetchLeboncoinAd } from '../src/services/leboncoin';

const sampleHtml = `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Offer",
        "url": "https://www.leboncoin.fr/ad/ventes_immobilieres/2947517015",
        "price": 425000,
        "priceCurrency": "EUR",
        "availabilityStarts": "2024-07-07T10:00:00+02:00",
        "itemOffered": {
          "@type": "Product",
          "name": "Appartement T3 70 m²",
          "description": "Bel appartement lumineux avec balcon",
          "image": [
            "https://images.example.com/1.jpg",
            "https://images.example.com/2.jpg"
          ],
          "sku": "2947517015",
          "numberOfRoomsTotal": 3,
          "floorSize": {
            "@type": "QuantitativeValue",
            "value": 70,
            "unitCode": "MTK"
          },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Paris",
            "postalCode": "75012",
            "addressRegion": "Île-de-France"
          }
        }
      }
    </script>
  </head>
  <body></body>
</html>
`;

const graphHtml = `
<html>
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": "Leboncoin"
          },
          {
            "@type": "Offer",
            "priceSpecification": {
              "@type": "PriceSpecification",
              "price": "275000",
              "priceCurrency": "EUR"
            },
            "itemOffered": {
              "@type": "Product",
              "name": "Maison 4 pièces",
              "description": "Maison avec jardin",
              "image": "https://images.example.com/only.jpg",
              "productID": "ABC-999"
            }
          }
        ]
      }
    </script>
  </head>
  <body></body>
</html>
`;

test('parse offer data from standard ld+json script', async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    text: async () => sampleHtml,
  })) as any;
  vi.stubGlobal('fetch', fetchMock);

  const result = await fetchLeboncoinAd(
    'https://www.leboncoin.fr/ad/ventes_immobilieres/2947517015',
  );

  expect(result.id).toBe('2947517015');
  expect(result.title).toBe('Appartement T3 70 m²');
  expect(result.price).toBe(425000);
  expect(result.location.city).toBe('Paris');
  expect(result.surface).toBe(70);
  expect(result.rooms).toBe(3);
  expect(result.images).toEqual([
    'https://images.example.com/1.jpg',
    'https://images.example.com/2.jpg',
  ]);
  expect(result.publishedAt).toBe('2024-07-07T10:00:00+02:00');
  expect(result.raw).toBeDefined();
});

test('supports ld+json graphs', async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    text: async () => graphHtml,
  })) as any;
  vi.stubGlobal('fetch', fetchMock);

  const result = await fetchLeboncoinAd('https://www.leboncoin.fr/ad/123');

  expect(result.id).toBe('999');
  expect(result.title).toBe('Maison 4 pièces');
  expect(result.price).toBe(275000);
  expect(result.images).toEqual(['https://images.example.com/only.jpg']);
});

test('throws when offer cannot be extracted', async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    text: async () => '<html></html>',
  })) as any;
  vi.stubGlobal('fetch', fetchMock);

  await expect(fetchLeboncoinAd('https://www.leboncoin.fr/ad/empty')).rejects.toThrow(
    'Unable to extract offer data from Leboncoin page',
  );
});
