/**
 * Kinematic tempo, pacing, and form tier calculations for live AI pose tracking.
 */

export type TempoPacing = 'optimal' | 'rushing' | 'slow';
export type FormTier = 'Gold' | 'Silver' | 'Bronze';

export interface TempoAnalysis {
  eccentricSeconds: number;
  concentricSeconds: number;
  totalDurationSeconds: number;
  pacing: TempoPacing;
  pacingFeedback: string;
}

/**
 * Evaluates the cadence of a repetition based on descent (eccentric) and ascent (concentric) time in milliseconds.
 * Hypertrophy standard: 1.5s - 3.5s eccentric for time-under-tension.
 */
export function calculateRepTempo(eccentricMs: number, concentricMs: number): TempoAnalysis {
  const eccentricSeconds = Math.round((eccentricMs / 1000) * 10) / 10;
  const concentricSeconds = Math.round((concentricMs / 1000) * 10) / 10;
  const totalDurationSeconds = Math.round((eccentricSeconds + concentricSeconds) * 10) / 10;

  let pacing: TempoPacing = 'optimal';
  let pacingFeedback = 'Controlled tempo (2s down, 1s up)';

  if (eccentricSeconds < 1.2) {
    pacing = 'rushing';
    pacingFeedback = 'Rushing eccentric descent! Slow down for muscle tension';
  } else if (eccentricSeconds > 4.5) {
    pacing = 'slow';
    pacingFeedback = 'Very slow descent. Maintain steady momentum';
  }

  return {
    eccentricSeconds,
    concentricSeconds,
    totalDurationSeconds,
    pacing,
    pacingFeedback,
  };
}

/**
 * Returns biomechanical form tier badge based on average kinematics score (0-100).
 */
export function getFormTier(score: number): { tier: FormTier; badge: string; color: string } {
  if (score >= 90) {
    return { tier: 'Gold', badge: '🥇 Gold Tier', color: '#EAB308' };
  }
  if (score >= 75) {
    return { tier: 'Silver', badge: '🥈 Silver Tier', color: '#94A3B8' };
  }
  return { tier: 'Bronze', badge: '🥉 Bronze Tier', color: '#B45309' };
}

/**
 * Generates concise audio coach cue for speech synthesis without lagging user.
 */
export function generateVoiceCue(
  rep: number,
  exercise: string,
  formScore: number,
  targetReps: number
): string {
  if (rep === targetReps) {
    return `Target of ${targetReps} reps crushed! Superb workout set!`;
  }
  if (formScore >= 95) {
    return `Rep ${rep}. Perfect form!`;
  }
  if (formScore < 70) {
    return `Rep ${rep}. Watch your depth.`;
  }
  return `Rep ${rep}.`;
}
