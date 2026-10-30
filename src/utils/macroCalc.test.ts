import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scaleFoodNutrients,
  calculateDailyTotals,
  calculateAdherence,
  calculate7DayAdherence,
} from './macroCalc';

test('scaleFoodNutrients scales Matooke accurately for a 200g serving', () => {
  // Matooke approx: 122 kcal, 1.3g protein, 29.6g carbs, 0.4g fat per 100g
  const matooke = {
    calories_100g: 122,
    protein_100g: 1.3,
    carbs_100g: 29.6,
    fat_100g: 0.4,
    fiber_100g: 2.3,
  };

  const scaled = scaleFoodNutrients(matooke, 200);
  assert.equal(scaled.calories, 244);
  assert.equal(scaled.protein, 2.6);
  assert.equal(scaled.carbs, 59.2);
  assert.equal(scaled.fat, 0.8);
  assert.equal(scaled.fiber, 4.6);
});

test('calculateDailyTotals sums multiple Ugandan meal logs accurately', () => {
  const mealLogs = [
    { calories: 350, protein: 12, carbs: 60, fat: 8 }, // Matooke + Beans
    { calories: 520, protein: 32, carbs: 45, fat: 20 }, // Tilapia + Posho + Dodo
    { calories: 250, protein: 14, carbs: 22, fat: 12 }, // Rolex
  ];

  const totals = calculateDailyTotals(mealLogs);
  assert.equal(totals.calories, 1120);
  assert.equal(totals.protein, 58);
  assert.equal(totals.carbs, 127);
  assert.equal(totals.fat, 40);
});

test('calculateAdherence scores target match and penalizes under/over shooting', () => {
  const target = 2000;

  // Exact target
  assert.equal(calculateAdherence(2000, target), 100);

  // 1600 kcal (80% of target)
  assert.equal(calculateAdherence(1600, target), 80);

  // 2400 kcal (120% of target, overshot by 20%) -> 80% adherence score
  assert.equal(calculateAdherence(2400, target), 80);
});

test('calculate7DayAdherence computes weekly average adherence accurately', () => {
  const target = 2000;
  const intakes = [2000, 1900, 2100, 1800, 2000, 1950, 2050];
  const weeklyScore = calculate7DayAdherence(intakes, target);
  assert.ok(weeklyScore >= 90);
});
