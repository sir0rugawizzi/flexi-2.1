import { test } from 'node:test';
import assert from 'node:assert';
import {
  evaluateHydrationSchedule,
  isReminderDueByInterval,
  DEFAULT_HYDRATION_SETTINGS,
  HydrationReminderSettings,
} from './hydrationReminderEngine';

test('evaluateHydrationSchedule suppresses reminders when daily target is reached', () => {
  const now = new Date('2026-11-03T11:00:00Z');
  const result = evaluateHydrationSchedule(3.5, 3.2, now);
  assert.strictEqual(result.shouldRemind, false);
  assert.strictEqual(result.isGoalCompleted, true);
  assert.strictEqual(result.slot, 'completed');
  assert.strictEqual(result.deficitLiters, 0);
});

test('evaluateHydrationSchedule triggers 2 PM Kampala heat alert when water is below 1.5L', () => {
  // 14:15 in Kampala (UTC 11:15)
  const afternoonTime = new Date('2026-11-03T11:15:00Z');
  const result = evaluateHydrationSchedule(0.8, 3.0, afternoonTime);
  assert.strictEqual(result.slot, 'afternoonHeat');
  assert.strictEqual(result.shouldRemind, true);
  assert.strictEqual(result.deficitLiters, 0.7);
  assert.strictEqual(result.urgency, 'medium');
  assert.ok(result.title.includes('2 PM Kampala Heat Alert'));
});

test('evaluateHydrationSchedule acknowledges hydration if 1.5L reached at 2 PM', () => {
  const afternoonTime = new Date('2026-11-03T11:15:00Z');
  const result = evaluateHydrationSchedule(1.6, 3.0, afternoonTime);
  assert.strictEqual(result.slot, 'afternoonHeat');
  assert.strictEqual(result.shouldRemind, false);
  assert.strictEqual(result.deficitLiters, 0);
});

test('evaluateHydrationSchedule suppresses reminders during night rest hours in Kampala', () => {
  // 23:30 in Kampala (UTC 20:30)
  const nightTime = new Date('2026-11-03T20:30:00Z');
  const result = evaluateHydrationSchedule(1.2, 3.0, nightTime);
  assert.strictEqual(result.slot, 'night');
  assert.strictEqual(result.shouldRemind, false);
});

test('isReminderDueByInterval handles snooze and elapsed intervals correctly', () => {
  const baseTime = 1730000000000;
  const settings: HydrationReminderSettings = {
    ...DEFAULT_HYDRATION_SETTINGS,
    intervalMinutes: 120,
    lastReminderTimestamp: baseTime,
    snoozedUntilTimestamp: baseTime + 30 * 60 * 1000, // snoozed 30 min
  };

  // During snooze, not due
  assert.strictEqual(isReminderDueByInterval(settings, baseTime + 15 * 60 * 1000), false);

  // After snooze expires but before 2h interval, not due
  assert.strictEqual(isReminderDueByInterval(settings, baseTime + 60 * 60 * 1000), false);

  // After 2h (120m) interval expires, due
  assert.strictEqual(isReminderDueByInterval(settings, baseTime + 121 * 60 * 1000), true);

  // If disabled, never due
  assert.strictEqual(
    isReminderDueByInterval({ ...settings, enabled: false }, baseTime + 200 * 60 * 1000),
    false
  );
});
