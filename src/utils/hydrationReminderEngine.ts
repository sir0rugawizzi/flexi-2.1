/**
 * Kampala Tropical Climate Hydration Reminder Engine
 * Timezone: Africa/Kampala (EAT, UTC+3)
 * Provides progressive daily reminders, heat-peak alerts, and interval pacing.
 */

export interface HydrationScheduleEvaluation {
  shouldRemind: boolean;
  slot: 'morning' | 'midday' | 'afternoonHeat' | 'workoutRecovery' | 'eveningTopoff' | 'completed' | 'night';
  title: string;
  message: string;
  tip: string;
  urgency: 'low' | 'medium' | 'high';
  deficitLiters: number;
  expectedLitersAtSlot: number;
  isGoalCompleted: boolean;
}

export interface HydrationReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 120 minutes (2 hours)
  allowSound: boolean;
  lastReminderTimestamp: number | null;
  snoozedUntilTimestamp: number | null;
}

export const DEFAULT_HYDRATION_SETTINGS: HydrationReminderSettings = {
  enabled: true,
  intervalMinutes: 120,
  allowSound: false,
  lastReminderTimestamp: null,
  snoozedUntilTimestamp: null,
};

/**
 * Returns current hour in Africa/Kampala time (0-23)
 */
export function getKampalaHour(date: Date = new Date()): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Kampala',
      hour: 'numeric',
      hour12: false,
    }).format(date);
    const parsed = parseInt(formatted, 10);
    return isNaN(parsed) ? date.getHours() : (parsed === 24 ? 0 : parsed);
  } catch {
    return date.getHours();
  }
}

/**
 * Evaluates whether a hydration reminder is due based on time of day in Kampala
 * and current intake vs expected pacing toward daily goal.
 */
export function evaluateHydrationSchedule(
  currentLiters: number,
  targetLiters: number,
  now: Date = new Date()
): HydrationScheduleEvaluation {
  const kampalaHour = getKampalaHour(now);
  const isGoalCompleted = currentLiters >= targetLiters;

  if (isGoalCompleted) {
    return {
      shouldRemind: false,
      slot: 'completed',
      title: 'Hydration Goal Achieved!',
      message: `You've logged ${currentLiters.toFixed(2)}L today, exceeding your ${targetLiters.toFixed(1)}L goal. Outstanding consistency!`,
      tip: 'Maintain gentle sips as needed without forcing intake.',
      urgency: 'low',
      deficitLiters: 0,
      expectedLitersAtSlot: targetLiters,
      isGoalCompleted: true,
    };
  }

  // Night hours (22:00 - 06:59) - Do not disturb sleep
  if (kampalaHour >= 22 || kampalaHour < 7) {
    return {
      shouldRemind: false,
      slot: 'night',
      title: 'Rest & Recovery Time',
      message: 'Rest hours in Kampala. No active water reminders scheduled.',
      tip: 'Keep a small glass bedside if you wake up thirsty.',
      urgency: 'low',
      deficitLiters: Math.max(0, targetLiters - currentLiters),
      expectedLitersAtSlot: 0,
      isGoalCompleted: false,
    };
  }

  // Morning Jumpstart (07:00 - 09:59)
  if (kampalaHour < 10) {
    const expected = Math.min(0.5, targetLiters * 0.2);
    const shouldRemind = currentLiters < expected;
    const deficit = Math.max(0, expected - currentLiters);
    return {
      shouldRemind,
      slot: 'morning',
      title: '🌅 Kampala Morning Jumpstart',
      message: currentLiters === 0
        ? 'Drink 500ml of water to wake up your digestive system and combat overnight dehydration.'
        : `You have logged ${currentLiters.toFixed(2)}L. Add another glass before your morning activities begin!`,
      tip: 'A large glass of clean water upon waking accelerates morning metabolic rate.',
      urgency: deficit > 0.3 ? 'medium' : 'low',
      deficitLiters: Number(deficit.toFixed(2)),
      expectedLitersAtSlot: expected,
      isGoalCompleted: false,
    };
  }

  // Midday Intake (10:00 - 12:59)
  if (kampalaHour < 13) {
    const expected = Math.min(1.0, targetLiters * 0.4);
    const shouldRemind = currentLiters < expected;
    const deficit = Math.max(0, expected - currentLiters);
    return {
      shouldRemind,
      slot: 'midday',
      title: '☀️ Midday Hydration Check',
      message: `Kampala temperatures are rising. You're at ${currentLiters.toFixed(2)}L of ${targetLiters.toFixed(1)}L goal. Drink a Rwenzori bottle (500ml) before lunch.`,
      tip: 'Hydrating 30 minutes before eating aids nutrient absorption and digestion.',
      urgency: deficit >= 0.5 ? 'medium' : 'low',
      deficitLiters: Number(deficit.toFixed(2)),
      expectedLitersAtSlot: expected,
      isGoalCompleted: false,
    };
  }

  // Kampala Afternoon Heat Peak (13:00 - 15:59)
  if (kampalaHour < 16) {
    const expected = 1.5;
    const shouldRemind = currentLiters < expected;
    const deficit = Math.max(0, expected - currentLiters);
    return {
      shouldRemind,
      slot: 'afternoonHeat',
      title: '🛡️ 2 PM Kampala Heat Alert',
      message: shouldRemind
        ? `Kampala heat peak reached! You've logged ${currentLiters.toFixed(2)}L, which is ${deficit.toFixed(2)}L below the 1.5L heat shield threshold.`
        : `Great job! You've hit ${currentLiters.toFixed(2)}L and shielded against midday tropical heat fatigue.`,
      tip: 'Kampala humidity increases unnoticeable sweat loss. Keep water easily accessible at your desk or home.',
      urgency: deficit >= 0.8 ? 'high' : 'medium',
      deficitLiters: Number(deficit.toFixed(2)),
      expectedLitersAtSlot: expected,
      isGoalCompleted: false,
    };
  }

  // Workout & Late Afternoon Recovery (16:00 - 18:59)
  if (kampalaHour < 19) {
    const expected = Math.min(2.2, targetLiters * 0.75);
    const shouldRemind = currentLiters < expected;
    const deficit = Math.max(0, expected - currentLiters);
    return {
      shouldRemind,
      slot: 'workoutRecovery',
      title: '⚡ Training Recovery Hydration',
      message: `Evening workout & recovery window. Current intake: ${currentLiters.toFixed(2)}L / ${targetLiters.toFixed(1)}L. Rehydrate to prevent muscle cramps.`,
      tip: 'Sip consistently during and after bodyweight sessions to maintain cellular volume.',
      urgency: deficit >= 0.7 ? 'medium' : 'low',
      deficitLiters: Number(deficit.toFixed(2)),
      expectedLitersAtSlot: expected,
      isGoalCompleted: false,
    };
  }

  // Evening Top-off (19:00 - 21:59)
  const expected = targetLiters * 0.9;
  const shouldRemind = currentLiters < expected;
  const deficit = Math.max(0, targetLiters - currentLiters);
  return {
    shouldRemind,
    slot: 'eveningTopoff',
    title: '🌙 Evening Hydration Quota',
    message: `You're ${deficit.toFixed(2)}L away from your ${targetLiters.toFixed(1)}L goal. Have a small glass now so you don't disrupt sleep later.`,
    tip: 'Taper heavy water intake 1 hour before sleep to avoid waking during deep REM cycles.',
    urgency: deficit >= 0.6 ? 'medium' : 'low',
    deficitLiters: Number(deficit.toFixed(2)),
    expectedLitersAtSlot: expected,
    isGoalCompleted: false,
  };
}

/**
 * Checks if interval timer has expired since last reminder or snooze.
 */
export function isReminderDueByInterval(
  settings: HydrationReminderSettings,
  nowTimestamp: number = Date.now()
): boolean {
  if (!settings.enabled) return false;

  // Check snooze
  if (settings.snoozedUntilTimestamp && nowTimestamp < settings.snoozedUntilTimestamp) {
    return false;
  }

  // If never reminded, it is due
  if (!settings.lastReminderTimestamp) return true;

  const intervalMs = settings.intervalMinutes * 60 * 1000;
  return nowTimestamp - settings.lastReminderTimestamp >= intervalMs;
}

/**
 * Request native browser notification permission safely
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return 'unsupported';
  }
}

/**
 * Dispatch desktop push notification if permission is granted
 */
export function dispatchNativePushNotification(
  title: string,
  body: string,
  icon: string = '/icons/icon-192.png'
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: false,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
