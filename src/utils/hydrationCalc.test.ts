import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHydrationTarget,
  calculateHydrationPercentage,
  getHydrationStatus,
  getHydrationRecommendations,
} from './hydrationCalc';

test('calculateHydrationTarget scales with body weight and workout day', () => {
  // Baseline 70kg without workout
  const baseTarget = calculateHydrationTarget({ weightKg: 70, activityLevel: 'moderate', hasWorkoutToday: false });
  assert.strictEqual(baseTarget, 2.5); // 70 * 0.035 = 2.45 -> rounded 2.5

  // 70kg with workout day (+0.6L)
  const workoutTarget = calculateHydrationTarget({ weightKg: 70, activityLevel: 'moderate', hasWorkoutToday: true });
  assert.strictEqual(workoutTarget, 3.1); // 2.45 + 0.6 = 3.05 -> rounded 3.1

  // Heavy athlete 90kg with high activity and workout
  const heavyTarget = calculateHydrationTarget({ weightKg: 90, activityLevel: 'high', hasWorkoutToday: true });
  assert.ok(heavyTarget >= 3.8);

  // Bounds check (never below 2.0L or above 4.5L)
  const tinyTarget = calculateHydrationTarget({ weightKg: 35, activityLevel: 'sedentary', hasWorkoutToday: false });
  assert.ok(tinyTarget >= 2.0);

  const massiveTarget = calculateHydrationTarget({ weightKg: 150, activityLevel: 'high', hasWorkoutToday: true });
  assert.ok(massiveTarget <= 4.5);
});

test('calculateHydrationPercentage computes exact progress and handles bounds', () => {
  assert.strictEqual(calculateHydrationPercentage(1.5, 3.0), 50);
  assert.strictEqual(calculateHydrationPercentage(3.0, 3.0), 100);
  assert.strictEqual(calculateHydrationPercentage(0, 2.5), 0);
  assert.strictEqual(calculateHydrationPercentage(4.0, 2.0), 150); // capped at 150
});

test('getHydrationStatus categorizes progress correctly', () => {
  assert.strictEqual(getHydrationStatus(0.2, 3.0).status, 'critical');
  assert.strictEqual(getHydrationStatus(0.9, 3.0).status, 'low');
  assert.strictEqual(getHydrationStatus(1.5, 3.0).status, 'progressing');
  assert.strictEqual(getHydrationStatus(2.5, 3.0).status, 'optimal');
  assert.strictEqual(getHydrationStatus(3.2, 3.0).status, 'exceeded');
});

test('getHydrationRecommendations provides time, workout, and climate-specific guidance', () => {
  // Morning recommendation
  const morningRecs = getHydrationRecommendations(0.5, 3.0, false, 8);
  const morningJumpstart = morningRecs.find((r) => r.id === 'morning_jumpstart');
  assert.ok(morningJumpstart);
  assert.strictEqual(morningJumpstart.tag, 'timing');

  // Workout recommendation
  const workoutRecs = getHydrationRecommendations(1.0, 3.0, true, 14);
  const workoutTip = workoutRecs.find((r) => r.id === 'workout_sweat');
  assert.ok(workoutTip);
  assert.strictEqual(workoutTip.tag, 'workout');

  // Local Ugandan food recommendations always present
  const foodTip = workoutRecs.find((r) => r.id === 'local_foods');
  assert.ok(foodTip);
  assert.ok(foodTip.text.includes('Pineapples') || foodTip.text.includes('Watermelon'));
});
