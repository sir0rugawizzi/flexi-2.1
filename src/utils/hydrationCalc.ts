/**
 * Pure calculation logic for daily client hydration tracking & recommendations
 */

export interface HydrationTargetParams {
  weightKg?: number;
  activityLevel?: string;
  hasWorkoutToday?: boolean;
  climateZone?: 'kampala_tropical' | 'standard';
}

export interface HydrationRecommendation {
  id: string;
  title: string;
  text: string;
  tag: 'timing' | 'climate' | 'workout' | 'nutrition' | 'electrolytes';
  iconType: 'droplet' | 'sun' | 'dumbbell' | 'apple' | 'zap';
}

/**
 * Calculates recommended daily water target in liters
 * Standard sports science rule: ~35ml per kg body weight, plus workout sweat replacement
 */
export function calculateHydrationTarget(params: HydrationTargetParams): number {
  const weight = params.weightKg && params.weightKg > 30 ? params.weightKg : 70;
  let target = weight * 0.035; // e.g. 70kg * 0.035 = 2.45L

  // Activity level adjustment
  const activity = params.activityLevel?.toLowerCase() || 'moderate';
  if (activity === 'high' || activity === 'very_active') {
    target += 0.4;
  } else if (activity === 'sedentary') {
    target -= 0.2;
  }

  // Workout sweat replacement (Kampala gym / outdoor sessions produce significant fluid loss)
  if (params.hasWorkoutToday) {
    target += 0.6; // +600ml for workout hydration
  }

  // Bound between 2.0L and 4.5L, rounded to 1 decimal place
  const bounded = Math.max(2.0, Math.min(4.5, target));
  return Math.round(bounded * 10) / 10;
}

/**
 * Calculates percentage of daily hydration goal achieved
 */
export function calculateHydrationPercentage(currentLiters: number, targetLiters: number): number {
  if (targetLiters <= 0) return 0;
  const pct = (currentLiters / targetLiters) * 100;
  return Math.round(Math.min(150, Math.max(0, pct)));
}

/**
 * Categorizes hydration status
 */
export function getHydrationStatus(currentLiters: number, targetLiters: number): {
  status: 'critical' | 'low' | 'progressing' | 'optimal' | 'exceeded';
  label: string;
  colorClass: string;
} {
  const pct = calculateHydrationPercentage(currentLiters, targetLiters);

  if (pct >= 100) {
    return {
      status: 'exceeded',
      label: 'Target Achieved! 🎯',
      colorClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    };
  }
  if (pct >= 75) {
    return {
      status: 'optimal',
      label: 'Almost There (75%+)',
      colorClass: 'text-sky-400 bg-sky-950/40 border-sky-800/50',
    };
  }
  if (pct >= 40) {
    return {
      status: 'progressing',
      label: 'Good Momentum (40%+)',
      colorClass: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
    };
  }
  if (pct >= 20) {
    return {
      status: 'low',
      label: 'Needs Attention (<40%)',
      colorClass: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    };
  }
  return {
    status: 'critical',
    label: 'Start Hydrating (<20%)',
    colorClass: 'text-rose-400 bg-rose-950/40 border-rose-800/50',
  };
}

/**
 * Returns contextual recommendations based on progress, workout status, and Ugandan climate
 */
export function getHydrationRecommendations(
  currentLiters: number,
  targetLiters: number,
  hasWorkoutToday: boolean,
  currentHourKampala: number = 12
): HydrationRecommendation[] {
  const recommendations: HydrationRecommendation[] = [];
  const pct = calculateHydrationPercentage(currentLiters, targetLiters);
  const remainingL = Math.max(0, Math.round((targetLiters - currentLiters) * 10) / 10);

  // 1. Time of Day Context
  if (currentHourKampala < 11) {
    recommendations.push({
      id: 'morning_jumpstart',
      title: 'Morning Jumpstart Protocol',
      text: 'Drink 500ml upon waking. Sleep naturally depletes water through respiration; jumpstarting hydration activates digestive motility and nutrient uptake.',
      tag: 'timing',
      iconType: 'droplet',
    });
  } else if (currentHourKampala >= 11 && currentHourKampala < 16) {
    recommendations.push({
      id: 'afternoon_slump',
      title: 'Mid-Day Focus & Temperature Control',
      text: 'Kampala afternoon heat peaks between 1:00 PM – 3:30 PM. A 1.5% drop in body water triggers fatigue and false hunger cravings. Sip continuously.',
      tag: 'climate',
      iconType: 'sun',
    });
  } else {
    recommendations.push({
      id: 'evening_taper',
      title: 'Evening Hydration Taper',
      text: remainingL > 0.5
        ? `You still have ${remainingL}L remaining. Sip steadily before 8:30 PM to reach your target without interrupting your sleep cycle with night wakings.`
        : 'Target achieved! Taper liquid intake before sleep to promote uninterrupted recovery and deep REM sleep.',
      tag: 'timing',
      iconType: 'droplet',
    });
  }

  // 2. Workout / Performance Context
  if (hasWorkoutToday) {
    recommendations.push({
      id: 'workout_sweat',
      title: 'Workout Sweat Loss Replacement',
      text: 'Today includes strength or conditioning training. Consume 400ml 30 minutes before your workout and sip 150ml every 15 minutes during training.',
      tag: 'workout',
      iconType: 'dumbbell',
    });
  }

  // 3. Electrolytes & Natural Ugandan Hydration Foods
  recommendations.push({
    id: 'local_foods',
    title: 'Indigenous Hydration Superfoods',
    text: 'Boost cellular absorption with water-rich Ugandan fruits: Fresh Watermelon, Luwero Pineapples (86% water), Pawpaw, and fresh coconut water (rich in bioavailable potassium).',
    tag: 'nutrition',
    iconType: 'apple',
  });

  // 4. Kampala Tap vs Purified Mineral Water Guidance
  recommendations.push({
    id: 'purified_water',
    title: 'Clean Source Assurance',
    text: 'Use boiled filtered water or trusted local mineral brands (Rwenzori, Highland). Add a squeeze of local lemon and a pinch of natural salt for natural electrolyte retention.',
    tag: 'electrolytes',
    iconType: 'zap',
  });

  return recommendations;
}

export interface HydrationAlertCheck {
  shouldAlert: boolean;
  alertType: 'afternoon_deficit' | 'none';
  message: string;
  shortTitle: string;
  deficitLiters: number;
}

/**
 * Checks whether client is in a hydration deficit past 2:00 PM (14:00) in Kampala
 * Target threshold: at least 1.5 liters logged by 2:00 PM
 */
export function checkAfternoonHydrationAlert(
  currentLiters: number,
  hourKampala: number = 14,
  thresholdLiters: number = 1.5
): HydrationAlertCheck {
  if (hourKampala >= 14 && currentLiters < thresholdLiters) {
    const deficit = Math.round((thresholdLiters - currentLiters) * 100) / 100;
    return {
      shouldAlert: true,
      alertType: 'afternoon_deficit',
      shortTitle: '2:00 PM Hydration Alert 💧',
      message: `It is past 2:00 PM and you have logged ${currentLiters.toFixed(2)}L of water today. Kampala's afternoon heat requires at least ${thresholdLiters.toFixed(1)}L by 2 PM to sustain metabolic rate and muscle hydration. Drink ${deficit.toFixed(2)}L to catch up!`,
      deficitLiters: deficit,
    };
  }
  return {
    shouldAlert: false,
    alertType: 'none',
    shortTitle: '',
    message: '',
    deficitLiters: 0,
  };
}

