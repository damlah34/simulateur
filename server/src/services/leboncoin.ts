export interface LeboncoinAdLocation {
  city: string | null;
  postalCode: string | null;
  region: string | null;
}

interface FetchInit {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export interface LeboncoinAdData {
  id: string | null;
  url: string;
  title: string;
  description: string;
  price: number | null;
  priceCurrency: string | null;
  surface: number | null;
  rooms: number | null;
  location: LeboncoinAdLocation;
  images: string[];
  publishedAt: string | null;
  raw: unknown;
}

const DEFAULT_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
};

export async function fetchLeboncoinAd(
  url: string,
  init: FetchInit = {},
): Promise<LeboncoinAdData> {
  const requestInit: FetchInit = {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...init.headers,
    },
  };

  const response = await fetch(url, requestInit as any);

  if (!response.ok) {
    throw new Error(`Leboncoin request failed with status ${response.status}`);
  }

  const html = await response.text();
  const offer = extractOfferFromHtml(html);

  if (!offer) {
    throw new Error('Unable to extract offer data from Leboncoin page');
  }

  return normaliseOffer(offer, url);
}

function extractOfferFromHtml(html: string): Record<string, unknown> | null {
  const ldJsonObjects = parseLdJsonBlocks(html);

  for (const block of ldJsonObjects) {
    const candidates = flattenLdJson(block);
    for (const candidate of candidates) {
      if (hasType(candidate, 'Offer')) {
        return candidate;
      }
    }
  }

  return null;
}

function parseLdJsonBlocks(html: string): unknown[] {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const raw = match[1]
      .replace(/\u2028|\u2029/g, '\\u2028')
      .trim();

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
      }
    } catch (error) {
      // Some pages include multiple JSON objects separated by new lines.
      // We attempt to recover by wrapping them in an array-like string.
      const recovered = recoverJsonObjects(raw);
      for (const entry of recovered) {
        blocks.push(entry);
      }
    }
  }

  return blocks;
}

function recoverJsonObjects(raw: string): unknown[] {
  const firstBrace = raw.indexOf('{');
  const firstBracket = raw.indexOf('[');
  const startCandidates = [firstBrace, firstBracket].filter((idx) => idx >= 0);
  if (startCandidates.length === 0) {
    return [];
  }

  const startIndex = Math.min(...startCandidates);

  const lastBrace = raw.lastIndexOf('}');
  const lastBracket = raw.lastIndexOf(']');
  const endCandidates = [lastBrace, lastBracket].filter((idx) => idx >= 0);
  if (endCandidates.length === 0) {
    return [];
  }

  const endIndex = Math.max(...endCandidates);
  if (endIndex < startIndex) {
    return [];
  }

  const cleaned = raw.slice(startIndex, endIndex + 1).trim();
  if (!cleaned) {
    return [];
  }

  const attempts = [cleaned, `[${cleaned}]`];

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      // ignore and continue
    }
  }

  return [];
}

function flattenLdJson(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenLdJson(entry));
  }

  const node = value as Record<string, unknown>;
  const graph = node['@graph'];
  if (Array.isArray(graph)) {
    return [node, ...graph.flatMap((entry) => flattenLdJson(entry))];
  }

  return [node];
}

function hasType(node: Record<string, unknown>, type: string): boolean {
  const nodeType = node['@type'];

  if (Array.isArray(nodeType)) {
    return nodeType.includes(type);
  }

  return nodeType === type;
}

function normaliseOffer(
  offer: Record<string, unknown>,
  fallbackUrl: string,
): LeboncoinAdData {
  const item = extractItemOffered(offer);
  const offerNode: Record<string, unknown> = offer;
  const itemNode: Record<string, unknown> = item ?? {};
  const combinedNode: Record<string, unknown> = (item ?? offer) as Record<string, unknown>;
  const priceInfo = extractPrice(offerNode);
  const address = extractAddress(combinedNode);
  const images = extractImages(combinedNode);

  return {
    id: extractIdentifier(combinedNode),
    url: extractString(offerNode['url']) ?? fallbackUrl,
    title: extractString(itemNode['name'] ?? offerNode['name']) ?? '',
    description: extractString(itemNode['description'] ?? offerNode['description']) ?? '',
    price: priceInfo.price,
    priceCurrency: priceInfo.currency,
    surface: extractSurface(combinedNode),
    rooms: extractNumber(itemNode['numberOfRoomsTotal'] ?? itemNode['numberOfRooms']),
    location: {
      city: address.city,
      postalCode: address.postalCode,
      region: address.region,
    },
    images,
    publishedAt: extractString(
      (offerNode['availabilityStarts'] ?? offerNode['validFrom']) as string | undefined,
    ),
    raw: offerNode,
  };
}

function extractItemOffered(offer: Record<string, unknown>): Record<string, unknown> | null {
  const item = offer['itemOffered'];
  if (item && typeof item === 'object') {
    return item as Record<string, unknown>;
  }

  return null;
}

function extractPrice(offer: Record<string, unknown>): { price: number | null; currency: string | null } {
  const price = extractNumber(offer['price']);
  const currency = extractString(offer['priceCurrency']);

  if (price !== null || currency) {
    return { price, currency: currency ?? null };
  }

  const spec = offer['priceSpecification'];
  if (spec && typeof spec === 'object') {
    return {
      price: extractNumber((spec as Record<string, unknown>).price),
      currency: extractString((spec as Record<string, unknown>).priceCurrency),
    };
  }

  return { price: null, currency: null };
}

function extractAddress(
  node: Record<string, unknown>,
): { city: string | null; postalCode: string | null; region: string | null } {
  const address = node['address'];

  if (!address || typeof address !== 'object') {
    return { city: null, postalCode: null, region: null };
  }

  const record = address as Record<string, unknown>;
  return {
    city: extractString(record.addressLocality),
    postalCode: extractString(record.postalCode),
    region: extractString(record.addressRegion ?? record.addressArea),
  };
}

function extractImages(node: Record<string, unknown>): string[] {
  const images = node['image'];

  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images.map((img) => extractString(img)).filter((value): value is string => Boolean(value));
  }

  const single = extractString(images);
  return single ? [single] : [];
}

function extractSurface(node: Record<string, unknown>): number | null {
  const floorSize = node['floorSize'] ?? node['size'] ?? node['area'];
  if (!floorSize) {
    return null;
  }

  if (typeof floorSize === 'object' && floorSize !== null) {
    const value = (floorSize as Record<string, unknown>).value ?? (floorSize as Record<string, unknown>).amount;
    return extractNumber(value);
  }

  return extractNumber(floorSize);
}

function extractIdentifier(node: Record<string, unknown>): string | null {
  const candidates = [node['productID'], node['sku'], node['identifier'], node['@id']];

  for (const candidate of candidates) {
    const str = extractString(candidate);
    if (str) {
      const match = str.match(/(\d+)/);
      return match ? match[1] : str;
    }
  }

  return null;
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[^0-9,.-]/g, '')
      .replace(/,(?=\d{3}\b)/g, '')
      .replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function extractString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  return null;
}
