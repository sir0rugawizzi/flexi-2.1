import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findMarketPriceItem,
  getCostPer100g,
  calculateItemCost,
  calculatePlanCost,
  suggestBudgetSwaps,
  formatUgx,
} from './marketPriceCalc';

test('findMarketPriceItem finds indigenous foods by name or local alias', () => {
  const matooke = findMarketPriceItem('Steamed Matooke');
  assert.ok(matooke);
  assert.strictEqual(matooke.category, 'staple');

  const mukene = findMarketPriceItem('Mukene');
  assert.ok(mukene);
  assert.ok(mukene.food_name.includes('Silverfish'));

  const tilapia = findMarketPriceItem('Fresh Tilapia (Steamed / Boiled)');
  assert.ok(tilapia);
  assert.strictEqual(tilapia.category, 'protein');

  const beef = findMarketPriceItem('Lean Beef Stew');
  assert.ok(beef);
});

test('getCostPer100g reflects market price differences across Kampala', () => {
  const kalerweMukene = getCostPer100g('Silverfish (Mukene / Dagaa Dried & Stewed)', 'protein', 'kalerwe');
  const nakaseroMukene = getCostPer100g('Silverfish (Mukene / Dagaa Dried & Stewed)', 'protein', 'nakasero');

  // Nakasero should be higher than Kalerwe
  assert.ok(nakaseroMukene > kalerweMukene, `Nakasero (${nakaseroMukene}) should be higher than Kalerwe (${kalerweMukene})`);

  const kalerweMatooke = getCostPer100g('Steamed Matooke', 'staple', 'kalerwe');
  const nakawaMatooke = getCostPer100g('Steamed Matooke', 'staple', 'nakawa');
  assert.ok(kalerweMatooke <= nakawaMatooke);
});

test('calculateItemCost calculates correct portion price and cost per gram of protein', () => {
  // 200g Matooke in Nakawa
  const cost = calculateItemCost('Steamed Matooke', 200, 'staple', 'nakawa');
  assert.strictEqual(cost.serving_grams, 200);
  assert.ok(cost.cost_ugx > 0);

  // 150g Beef
  const beefCost = calculateItemCost('Lean Beef Stew', 150, 'protein', 'nakawa', 36);
  assert.ok(beefCost.cost_ugx > 1000);
  assert.ok(beefCost.cost_per_gram_protein > 0);
});

test('calculatePlanCost computes comprehensive daily, weekly, and tier breakdown', () => {
  const sampleMeals = [
    { food_name: 'Katogo (Matooke with Beans)', serving_grams: 300, meal_type: 'breakfast', protein: 14.4 },
    { food_name: 'Fresh Tilapia (Steamed / Boiled)', serving_grams: 180, meal_type: 'lunch', protein: 36.2 },
    { food_name: 'Steamed Matooke', serving_grams: 200, meal_type: 'lunch', protein: 2.6 },
    { food_name: 'Steamed Nakati (Bitter Greens)', serving_grams: 150, meal_type: 'lunch', protein: 4.8 },
    { food_name: 'Stewed Yellow Beans', serving_grams: 200, meal_type: 'dinner', protein: 16.4 },
    { food_name: 'Sweet Potatoes (Steamed)', serving_grams: 200, meal_type: 'dinner', protein: 3.2 },
    { food_name: 'Roasted Groundnuts', serving_grams: 50, meal_type: 'snack', protein: 12.9 },
  ];

  const planCost = calculatePlanCost(sampleMeals, 'kalerwe');

  assert.ok(planCost.daily_cost_ugx > 0);
  assert.strictEqual(planCost.weekly_cost_ugx, planCost.daily_cost_ugx * 7);
  assert.strictEqual(planCost.monthly_cost_ugx, planCost.daily_cost_ugx * 30);
  assert.ok(planCost.breakdown_by_meal.breakfast > 0);
  assert.ok(planCost.breakdown_by_meal.lunch > 0);
  assert.ok(planCost.breakdown_by_meal.dinner > 0);
  assert.ok(planCost.breakdown_by_meal.snack > 0);
  assert.ok(planCost.cost_per_gram_protein > 0);
  assert.ok(planCost.budget_tier);
});

test('suggestBudgetSwaps suggests high-protein silverfish mukene when expensive beef is used', () => {
  const beefMeal = [
    { food_name: 'Lean Beef Stew', serving_grams: 200, protein: 48 },
  ];

  const swaps = suggestBudgetSwaps(beefMeal, 'nakawa');
  assert.ok(swaps.length > 0);
  const mukeneSwap = swaps.find((s) => s.suggested_food.toLowerCase().includes('mukene'));
  assert.ok(mukeneSwap);
  assert.ok(mukeneSwap.daily_savings_ugx > 500);
});

test('formatUgx formats Ugandan currency cleanly', () => {
  assert.strictEqual(formatUgx(5000), 'UGX 5,000');
  assert.strictEqual(formatUgx(125000), 'UGX 125,000');
});
