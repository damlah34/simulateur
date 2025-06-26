export interface CityPriceResponse {
  averagePrice: number;
}

export async function fetchCityPrice(city: string): Promise<number> {
  const url = `https://api.example.com/prices?city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  const data: CityPriceResponse = await res.json();
  return data.averagePrice;
}
