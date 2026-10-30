import { Food } from '../../types';

export interface ExternalFoodItem {
  id: string;
  name: string;
  brand?: string;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  serving_unit: string;
  source: string;
}

/**
 * Searches the free Open Food Facts REST API for packaged foods and groceries
 */
export async function searchOpenFoodFacts(query: string): Promise<ExternalFoodItem[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=10`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FlexiFitUganda/1.0 (rugawizzi@gmail.com)',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json() as {
      products?: Array<{
        code?: string;
        product_name?: string;
        brands?: string;
        nutriments?: {
          'energy-kcal_100g'?: number;
          proteins_100g?: number;
          carbohydrates_100g?: number;
          fat_100g?: number;
        };
        serving_size?: string;
      }>;
    };

    if (!data.products) return [];

    return data.products
      .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] !== undefined)
      .map((p, idx) => ({
        id: `off-${p.code || idx}`,
        name: p.product_name || 'Packaged Grocery',
        brand: p.brands,
        calories_100g: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
        protein_100g: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
        carbs_100g: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        fat_100g: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
        serving_unit: p.serving_size || '100g',
        source: 'Open Food Facts Database',
      }));
  } catch (err) {
    console.warn('[OpenFoodFacts] Request error or timeout:', err);
    return [];
  }
}
