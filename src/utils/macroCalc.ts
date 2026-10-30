import { Food, MealLog } from '../types';

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

/**
 * Scales nutritional components from per 100g to specified portion size in grams.
 */
export function scaleFoodNutrients(
  food: Pick<Food, 'calories_100g' | 'protein_100g' | 'carbs_100g' | 'fat_100g' | 'fiber_100g'>,
  grams: number
): MacroNutrients {
  if (grams <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }
  const factor = grams / 100.0;
  return {
    calories: Math.round(food.calories_100g * factor),
    protein: Math.round(food.protein_100g * factor * 10) / 10,
    carbs: Math.round(food.carbs_100g * factor * 10) / 10,
    fat: Math.round(food.fat_100g * factor * 10) / 10,
    fiber: food.fiber_100g ? Math.round(food.fiber_100g * factor * 10) / 10 : 0,
  };
}

/**
 * Calculates sum of daily calories and macronutrients from a list of meal logs.
 */
export function calculateDailyTotals(logs: Pick<MealLog, 'calories' | 'protein' | 'carbs' | 'fat'>[]): MacroNutrients {
  return logs.reduce(
    (acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      acc.carbs += log.carbs || 0;
      acc.fat += log.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calculates adherence percentage (0 - 100%) against target calories.
 * A score between 90% and 110% of target represents optimal compliance.
 */
export function calculateAdherence(actual: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = (actual / target) * 100;
  // If user hits 95% of target, adherence is 95%.
  // If user overshoots target (e.g. 150%), adherence score declines symmetrically.
  if (ratio <= 100) {
    return Math.min(100, Math.round(ratio));
  }
  // Penalty for overshooting beyond 100%: 120% intake yields 80% adherence score
  const excess = ratio - 100;
  const score = Math.max(0, Math.round(100 - excess));
  return score;
}

/**
 * Computes 7-day average adherence percentage across days with targets.
 */
export function calculate7DayAdherence(dailyIntakes: number[], targetDailyCalories: number): number {
  if (!dailyIntakes.length || targetDailyCalories <= 0) return 0;
  const totalScores = dailyIntakes.reduce((acc, intake) => {
    return acc + calculateAdherence(intake, targetDailyCalories);
  }, 0);
  return Math.round(totalScores / dailyIntakes.length);
}
