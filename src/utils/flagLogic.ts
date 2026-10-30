import { ClientFlags } from '../types';

export interface FlagThresholds {
  workoutInactivityDays: number; // default: 3 days
  macroAdherenceMinPercent: number; // default: 70%
  weightStalenessDays: number; // default: 7 days
  checkInOverdueDays: number; // default: 7 days
}

export const DEFAULT_FLAG_THRESHOLDS: FlagThresholds = {
  workoutInactivityDays: 3,
  macroAdherenceMinPercent: 70,
  weightStalenessDays: 7,
  checkInOverdueDays: 7,
};

export interface ClientComplianceInput {
  lastWorkoutDate?: string | Date;
  sevenDayMacroAdherence: number; // 0 - 100
  lastWeightDate?: string | Date;
  lastCheckInDate?: string | Date;
  referenceDate?: string | Date; // Date against which to evaluate (defaults to now)
}

export interface EvaluationResult {
  isFlagged: boolean;
  flags: ClientFlags;
  flagReasons: string[];
}

function getDaysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates compliance flags for a client according to configured business rules.
 */
export function evaluateClientCompliance(
  input: ClientComplianceInput,
  thresholds: FlagThresholds = DEFAULT_FLAG_THRESHOLDS
): EvaluationResult {
  const now = input.referenceDate ? new Date(input.referenceDate) : new Date();

  // 1. Workout Inactivity Flag: No workout logged in >= threshold days
  let missedWorkouts = false;
  if (!input.lastWorkoutDate) {
    missedWorkouts = true;
  } else {
    const daysSinceWorkout = getDaysBetween(new Date(input.lastWorkoutDate), now);
    if (daysSinceWorkout >= thresholds.workoutInactivityDays) {
      missedWorkouts = true;
    }
  }

  // 2. Nutrition Deficit Flag: 7-day macro adherence < threshold %
  const nutritionDeficit = input.sevenDayMacroAdherence < thresholds.macroAdherenceMinPercent;

  // 3. Weight Staleness Flag: No weight logged in >= threshold days
  let staleWeight = false;
  if (!input.lastWeightDate) {
    staleWeight = true;
  } else {
    const daysSinceWeight = getDaysBetween(new Date(input.lastWeightDate), now);
    if (daysSinceWeight >= thresholds.weightStalenessDays) {
      staleWeight = true;
    }
  }

  // 4. Overdue Check-in Flag: Weekly check-in missed
  let overdueCheckin = false;
  if (!input.lastCheckInDate) {
    overdueCheckin = true;
  } else {
    const daysSinceCheckin = getDaysBetween(new Date(input.lastCheckInDate), now);
    if (daysSinceCheckin >= thresholds.checkInOverdueDays) {
      overdueCheckin = true;
    }
  }

  const flagReasons: string[] = [];
  if (missedWorkouts) {
    flagReasons.push(`No workout logged in the last ${thresholds.workoutInactivityDays} days`);
  }
  if (nutritionDeficit) {
    flagReasons.push(`7-day macro adherence is below ${thresholds.macroAdherenceMinPercent}% (currently ${Math.round(input.sevenDayMacroAdherence)}%)`);
  }
  if (staleWeight) {
    flagReasons.push(`No weight logged in the last ${thresholds.weightStalenessDays} days`);
  }
  if (overdueCheckin) {
    flagReasons.push(`Weekly check-in missed (over ${thresholds.checkInOverdueDays} days since last)`);
  }

  const isFlagged = missedWorkouts || nutritionDeficit || staleWeight || overdueCheckin;

  return {
    isFlagged,
    flags: {
      missed_workouts: missedWorkouts,
      nutrition_deficit: nutritionDeficit,
      stale_weight: staleWeight,
      overdue_checkin: overdueCheckin,
    },
    flagReasons,
  };
}
