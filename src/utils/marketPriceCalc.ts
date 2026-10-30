import { KampalaMarketId, PlanCostSummary, BudgetSwapSuggestion, MealItemCost } from '../types';
import { KAMPALA_MARKETS, KAMPALA_FOOD_PRICES, MarketFoodItem, getBaselineCostPer100g } from '../data/kampalaMarketPrices';

/**
 * Normalizes string for flexible matching across local and English names
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds the price entry in the Kampala market dataset
 */
export function findMarketPriceItem(foodName: string): MarketFoodItem | undefined {
  const norm = normalizeName(foodName);

  // Direct match
  const exact = KAMPALA_FOOD_PRICES.find((item) => normalizeName(item.food_name) === norm);
  if (exact) return exact;

  // Substring match
  const partial = KAMPALA_FOOD_PRICES.find(
    (item) => norm.includes(normalizeName(item.food_name)) || normalizeName(item.food_name).includes(norm)
  );
  if (partial) return partial;

  // Keyword aliases
  if (norm.includes('matooke') || norm.includes('amatooke')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Matooke'));
  }
  if (norm.includes('mukene') || norm.includes('silverfish') || norm.includes('dagaa')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Silverfish'));
  }
  if (norm.includes('tilapia') || norm.includes('ngege')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Tilapia'));
  }
  if (norm.includes('perch') || norm.includes('mputa')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Perch'));
  }
  if (norm.includes('beef') || norm.includes('ente')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Beef'));
  }
  if (norm.includes('goat') || norm.includes('mbuzi')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Goat'));
  }
  if (norm.includes('chicken') || norm.includes('nkoko')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Chicken'));
  }
  if (norm.includes('beans') || norm.includes('bijanjaalo')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Beans'));
  }
  if (norm.includes('gnut') || norm.includes('groundnut') || norm.includes('binyebwa')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Groundnut'));
  }
  if (norm.includes('posho') || norm.includes('ugali') || norm.includes('kawunga')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Posho'));
  }
  if (norm.includes('kalo') || norm.includes('millet')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Kalo'));
  }
  if (norm.includes('cassava') || norm.includes('mawogo') || norm.includes('muhogo')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Cassava'));
  }
  if (norm.includes('sweetpotato') || norm.includes('lumonde')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Sweet Potatoes'));
  }
  if (norm.includes('egg') || norm.includes('magi')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Eggs'));
  }
  if (norm.includes('nakati') || norm.includes('dodo') || norm.includes('sukuma')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.category === 'vegetable');
  }
  if (norm.includes('avocado')) {
    return KAMPALA_FOOD_PRICES.find((i) => i.food_name.includes('Avocado'));
  }

  return undefined;
}

/**
 * Returns cost per 100g in UGX for a given food at a designated Kampala market
 */
export function getCostPer100g(
  foodName: string,
  category: string = 'staple',
  marketId: KampalaMarketId = 'nakawa'
): number {
  const item = findMarketPriceItem(foodName);
  const market = KAMPALA_MARKETS[marketId] || KAMPALA_MARKETS.nakawa;

  if (item) {
    if (item.market_prices_ugx && item.market_prices_ugx[marketId] !== undefined) {
      return item.market_prices_ugx[marketId]!;
    }
    return Math.round(item.cost_per_100g_ugx * market.priceMultiplier);
  }

  // Fallback category multiplier
  const fallbackBase = getBaselineCostPer100g(category);
  return Math.round(fallbackBase * market.priceMultiplier);
}

/**
 * Calculates item cost given serving grams
 */
export function calculateItemCost(
  foodName: string,
  servingGrams: number,
  category: string = 'staple',
  marketId: KampalaMarketId = 'nakawa',
  proteinGrams?: number
): MealItemCost {
  const unitCost100g = getCostPer100g(foodName, category, marketId);
  const cost = Math.round((unitCost100g * servingGrams) / 100);

  const matched = findMarketPriceItem(foodName);
  const protein = proteinGrams ?? (matched ? (matched.protein_per_100g * servingGrams) / 100 : 5);
  const costPerGramProtein = protein > 0 ? Math.round((cost / protein) * 10) / 10 : 0;

  return {
    food_id: foodName,
    food_name: foodName,
    serving_grams: servingGrams,
    cost_ugx: cost,
    unit_price_per_100g: unitCost100g,
    cost_per_gram_protein: costPerGramProtein,
  };
}

/**
 * Suggests budget-saving ingredient swaps (e.g., swapping beef/goat for mukene/beans or rice for cassava)
 */
export function suggestBudgetSwaps(
  meals: Array<{ food_name: string; serving_grams: number; protein?: number }>,
  marketId: KampalaMarketId = 'nakawa'
): BudgetSwapSuggestion[] {
  const suggestions: BudgetSwapSuggestion[] = [];

  for (const item of meals) {
    const norm = normalizeName(item.food_name);

    // 1. Beef / Goat / Chicken -> Mukene (Silverfish) or Beans
    if (norm.includes('beef') || norm.includes('goat') || norm.includes('meat') || (norm.includes('chicken') && !norm.includes('luwombo'))) {
      const currentCost = calculateItemCost(item.food_name, item.serving_grams, 'protein', marketId).cost_ugx;
      // Mukene is roughly 48g protein/100g, so 50g mukene provides ~24g protein (same as 150g beef!)
      const mukenePortionGrams = Math.round(item.serving_grams * 0.4);
      const mukeneCost = calculateItemCost('Silverfish (Mukene / Dagaa Dried & Stewed)', mukenePortionGrams, 'protein', marketId).cost_ugx;
      const dailySavings = Math.max(0, currentCost - mukeneCost);

      if (dailySavings > 800) {
        suggestions.push({
          current_food: `${item.food_name} (${item.serving_grams}g)`,
          suggested_food: `Silverfish Mukene (${mukenePortionGrams}g dry stewed)`,
          daily_savings_ugx: dailySavings,
          weekly_savings_ugx: dailySavings * 7,
          protein_comparison: 'Equal or higher protein (~24g protein) + natural calcium boost',
          reason: `Mukene at ${KAMPALA_MARKETS[marketId].name} costs ~1/4th the price of beef while yielding denser leucine & iron.`,
        });
      }

      // Yellow Beans swap option
      const beansCost = calculateItemCost('Stewed Yellow Beans', 180, 'protein', marketId).cost_ugx;
      const beanSavings = Math.max(0, currentCost - beansCost);
      if (beanSavings > 600) {
        suggestions.push({
          current_food: `${item.food_name} (${item.serving_grams}g)`,
          suggested_food: 'Stewed Yellow Beans (180g) + G-Nut Sauce (60g)',
          daily_savings_ugx: beanSavings,
          weekly_savings_ugx: beanSavings * 7,
          protein_comparison: '~22g combined plant protein with complete amino acid profile',
          reason: 'Traditional Buganda staple pair provides steady fiber and sustained energy at fraction of butchery cost.',
        });
      }
    }

    // 2. White Rice -> Sweet Potatoes or Boiled Cassava
    if (norm.includes('rice') || norm.includes('omucere')) {
      const currentCost = calculateItemCost(item.food_name, item.serving_grams, 'staple', marketId).cost_ugx;
      const tuberCost = calculateItemCost('Sweet Potatoes (Steamed)', item.serving_grams, 'staple', marketId).cost_ugx;
      const savings = Math.max(0, currentCost - tuberCost);

      if (savings > 200) {
        suggestions.push({
          current_food: `${item.food_name} (${item.serving_grams}g)`,
          suggested_food: `Steamed Sweet Potatoes / Lumonde (${item.serving_grams}g)`,
          daily_savings_ugx: savings,
          weekly_savings_ugx: savings * 7,
          protein_comparison: 'Similar clean carbs, +300% more vitamin A & dietary fiber',
          reason: 'Locally grown tubers in Uganda are fresher and significantly cheaper than imported polished rice.',
        });
      }
    }
  }

  // Deduplicate suggestions by suggested_food
  const unique: BudgetSwapSuggestion[] = [];
  const seen = new Set<string>();
  for (const s of suggestions) {
    const key = `${s.current_food}->${s.suggested_food}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }

  return unique.slice(0, 3);
}

/**
 * Full calculation for a meal plan schedule
 */
export function calculatePlanCost(
  meals: Array<{
    food_id?: string;
    food_name: string;
    serving_grams: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
    category?: string;
    protein?: number;
  }>,
  marketId: KampalaMarketId = 'nakawa'
): PlanCostSummary {
  const market = KAMPALA_MARKETS[marketId] || KAMPALA_MARKETS.nakawa;

  let dailyTotal = 0;
  let totalProtein = 0;

  const breakdownByMeal: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };

  const breakdownByCategory: Record<string, number> = {};

  for (const m of meals) {
    const cost = calculateItemCost(m.food_name, m.serving_grams, m.category || 'staple', marketId, m.protein).cost_ugx;
    dailyTotal += cost;
    totalProtein += m.protein || 0;

    const mtype = (m.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack') || 'snack';
    if (breakdownByMeal[mtype] !== undefined) {
      breakdownByMeal[mtype] += cost;
    } else {
      breakdownByMeal.snack += cost;
    }

    const matched = findMarketPriceItem(m.food_name);
    const vendorStall = matched?.vendor_stall_type || 'Produce & Tubers';
    breakdownByCategory[vendorStall] = (breakdownByCategory[vendorStall] || 0) + cost;
  }

  const weeklyCost = dailyTotal * 7;
  const monthlyCost = dailyTotal * 30;
  const costPerGramProtein = totalProtein > 0 ? Math.round((dailyTotal / totalProtein) * 10) / 10 : 0;

  // Determine budget tier
  let budget_tier: PlanCostSummary['budget_tier'] = 'budget_friendly';
  let budget_tier_label = 'Standard Local Ugandan Standard';

  if (dailyTotal <= 6000) {
    budget_tier = 'ultra_budget';
    budget_tier_label = 'Ultra-Budget / High Efficiency (Mukene/Beans/Tubers)';
  } else if (dailyTotal <= 11000) {
    budget_tier = 'budget_friendly';
    budget_tier_label = 'Balanced Kampala Middle-Class Diet';
  } else if (dailyTotal <= 18000) {
    budget_tier = 'moderate';
    budget_tier_label = 'Athlete Performance / Fresh Lake Tilapia';
  } else {
    budget_tier = 'premium';
    budget_tier_label = 'Executive / Premium Grass-fed Beef & Luwombo';
  }

  const smartSwaps = suggestBudgetSwaps(meals, marketId);

  return {
    market_id: marketId,
    market_name: market.name,
    daily_cost_ugx: dailyTotal,
    weekly_cost_ugx: weeklyCost,
    monthly_cost_ugx: monthlyCost,
    cost_per_gram_protein: costPerGramProtein,
    budget_tier,
    budget_tier_label,
    breakdown_by_meal: breakdownByMeal,
    breakdown_by_category: breakdownByCategory,
    smart_swaps: smartSwaps,
  };
}

/**
 * Formats UGX currency with comma separation
 */
export function formatUgx(amount: number): string {
  const rounded = Math.round(amount);
  return `UGX ${rounded.toLocaleString('en-US')}`;
}
