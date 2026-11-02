/**
 * Client achievement milestones and visual badge calculation engine.
 * Evaluates real-time compliance for hydration, workout consistency, streak progression, and form accuracy.
 */

import { MilestoneBadge } from '../types';

export interface MilestoneContext {
  waterLoggedLiters: number;
  waterTargetLiters: number;
  streakDays: number;
  workoutCompletedToday: boolean;
  totalWorkoutsCompleted: number;
  proteinGramsLogged: number;
  proteinTargetGrams: number;
  aiPoseScore?: number;
}

/**
 * Evaluates and returns all user milestones with calculated progress and unlocked states.
 */
export function evaluateMilestones(ctx: MilestoneContext): MilestoneBadge[] {
  const waterTarget = Math.max(1, ctx.waterTargetLiters);
  const waterProgress = Math.min(ctx.waterLoggedLiters, waterTarget);
  const isHydrationHit = ctx.waterLoggedLiters >= waterTarget;

  const proteinTarget = Math.max(1, ctx.proteinTargetGrams);
  const isProteinTargetHit = ctx.proteinGramsLogged >= proteinTarget * 0.85;

  return [
    {
      id: 'hydration-champion',
      category: 'hydration',
      title: 'Hydration Champion',
      tier: 'gold',
      description: 'Hit 100% of your bodyweight hydration quota calibrated for Kampala tropical climate.',
      criteria: `Log at least ${waterTarget.toFixed(1)}L of water in a single day.`,
      iconName: 'Droplets',
      accentColor: '#06B6D4', // Cyan
      currentValue: ctx.waterLoggedLiters,
      targetValue: waterTarget,
      unit: 'L',
      isUnlocked: isHydrationHit,
      unlockedAt: isHydrationHit ? new Date().toISOString() : undefined,
    },
    {
      id: 'tropical-noon-shield',
      category: 'hydration',
      title: '2 PM Heat Shield',
      tier: 'silver',
      description: 'Logged 1.5L before Kampala afternoon temperature peak to prevent heat fatigue.',
      criteria: 'Log at least 1.5L of water.',
      iconName: 'ShieldAlert',
      accentColor: '#38BDF8', // Light sky
      currentValue: Math.min(ctx.waterLoggedLiters, 1.5),
      targetValue: 1.5,
      unit: 'L',
      isUnlocked: ctx.waterLoggedLiters >= 1.5,
      unlockedAt: ctx.waterLoggedLiters >= 1.5 ? new Date().toISOString() : undefined,
    },
    {
      id: 'consistency-beast',
      category: 'workout',
      title: 'Consistency Beast',
      tier: 'gold',
      description: 'Completed scheduled workout training assignment for today.',
      criteria: 'Complete Day 1 Lower Body Power or scheduled program.',
      iconName: 'Dumbbell',
      accentColor: '#FF6A00', // Energy orange
      currentValue: ctx.workoutCompletedToday ? 1 : 0,
      targetValue: 1,
      unit: 'session',
      isUnlocked: ctx.workoutCompletedToday,
      unlockedAt: ctx.workoutCompletedToday ? new Date().toISOString() : undefined,
    },
    {
      id: 'streak-warrior',
      category: 'streak',
      title: 'Kampala Iron Streak',
      tier: 'platinum',
      description: 'Sustained continuous daily habit logging across training and indigenous nutrition.',
      criteria: 'Reach at least a 3-day active logging streak.',
      iconName: 'Flame',
      accentColor: '#F59E0B', // Amber
      currentValue: ctx.streakDays,
      targetValue: 3,
      unit: 'days',
      isUnlocked: ctx.streakDays >= 3,
      unlockedAt: ctx.streakDays >= 3 ? new Date().toISOString() : undefined,
    },
    {
      id: 'indigenous-protein-pro',
      category: 'nutrition',
      title: 'Indigenous Fuel Pro',
      tier: 'gold',
      description: 'Hit 85%+ of daily protein requirement powered by Matooke, Tilapia, Beans, or Mukene.',
      criteria: `Log at least ${Math.round(proteinTarget * 0.85)}g of protein.`,
      iconName: 'UtensilsCrossed',
      accentColor: '#10B981', // Emerald
      currentValue: ctx.proteinGramsLogged,
      targetValue: proteinTarget,
      unit: 'g',
      isUnlocked: isProteinTargetHit,
      unlockedAt: isProteinTargetHit ? new Date().toISOString() : undefined,
    },
    {
      id: 'ai-form-master',
      category: 'kinematics',
      title: 'Kinematic Form Master',
      tier: 'platinum',
      description: 'Achieved Gold Tier (>=90%) biomechanical precision on live camera joint tracking.',
      criteria: 'Complete an on-device MediaPipe set with >= 90% score.',
      iconName: 'Sparkles',
      accentColor: '#A855F7', // Purple
      currentValue: ctx.aiPoseScore || 0,
      targetValue: 90,
      unit: '%',
      isUnlocked: (ctx.aiPoseScore || 0) >= 90,
      unlockedAt: (ctx.aiPoseScore || 0) >= 90 ? new Date().toISOString() : undefined,
    },
  ];
}

/**
 * Returns summary count of earned badges.
 */
export function countEarnedMilestones(badges: MilestoneBadge[]): { earned: number; total: number; percentage: number } {
  const earned = badges.filter((b) => b.isUnlocked).length;
  const total = badges.length;
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { earned, total, percentage };
}
