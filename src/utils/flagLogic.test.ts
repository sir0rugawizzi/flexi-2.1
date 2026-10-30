import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateClientCompliance, DEFAULT_FLAG_THRESHOLDS } from './flagLogic';

test('client with recent activity and high adherence is NOT flagged', () => {
  const refDate = new Date('2026-10-30T12:00:00Z');
  const result = evaluateClientCompliance({
    lastWorkoutDate: new Date('2026-10-29T10:00:00Z'), // 1 day ago
    sevenDayMacroAdherence: 88, // > 70%
    lastWeightDate: new Date('2026-10-28T07:00:00Z'), // 2 days ago
    lastCheckInDate: new Date('2026-10-26T08:00:00Z'), // 4 days ago
    referenceDate: refDate,
  });

  assert.equal(result.isFlagged, false);
  assert.equal(result.flagReasons.length, 0);
  assert.equal(result.flags.missed_workouts, false);
  assert.equal(result.flags.nutrition_deficit, false);
  assert.equal(result.flags.stale_weight, false);
  assert.equal(result.flags.overdue_checkin, false);
});

test('client with no workout in 4 days is flagged for missed workouts', () => {
  const refDate = new Date('2026-10-30T12:00:00Z');
  const result = evaluateClientCompliance({
    lastWorkoutDate: new Date('2026-10-26T10:00:00Z'), // 4 days ago
    sevenDayMacroAdherence: 85,
    lastWeightDate: new Date('2026-10-28T07:00:00Z'),
    lastCheckInDate: new Date('2026-10-25T08:00:00Z'),
    referenceDate: refDate,
  });

  assert.equal(result.isFlagged, true);
  assert.equal(result.flags.missed_workouts, true);
  assert.match(result.flagReasons[0], /No workout logged in the last 3 days/);
});

test('client with 7-day macro adherence at 62% is flagged for nutrition deficit', () => {
  const refDate = new Date('2026-10-30T12:00:00Z');
  const result = evaluateClientCompliance({
    lastWorkoutDate: new Date('2026-10-29T10:00:00Z'),
    sevenDayMacroAdherence: 62, // < 70%
    lastWeightDate: new Date('2026-10-28T07:00:00Z'),
    lastCheckInDate: new Date('2026-10-27T08:00:00Z'),
    referenceDate: refDate,
  });

  assert.equal(result.isFlagged, true);
  assert.equal(result.flags.nutrition_deficit, true);
  assert.match(result.flagReasons[0], /7-day macro adherence is below 70%/);
});

test('client with no weight in 9 days is flagged for stale weight', () => {
  const refDate = new Date('2026-10-30T12:00:00Z');
  const result = evaluateClientCompliance({
    lastWorkoutDate: new Date('2026-10-29T10:00:00Z'),
    sevenDayMacroAdherence: 82,
    lastWeightDate: new Date('2026-10-20T07:00:00Z'), // 10 days ago
    lastCheckInDate: new Date('2026-10-25T08:00:00Z'),
    referenceDate: refDate,
  });

  assert.equal(result.isFlagged, true);
  assert.equal(result.flags.stale_weight, true);
  assert.match(result.flagReasons[0], /No weight logged in the last 7 days/);
});

test('client with missed weekly check-in is flagged for overdue check-in', () => {
  const refDate = new Date('2026-10-30T12:00:00Z');
  const result = evaluateClientCompliance({
    lastWorkoutDate: new Date('2026-10-29T10:00:00Z'),
    sevenDayMacroAdherence: 90,
    lastWeightDate: new Date('2026-10-28T07:00:00Z'),
    lastCheckInDate: new Date('2026-10-20T08:00:00Z'), // 10 days ago
    referenceDate: refDate,
  });

  assert.equal(result.isFlagged, true);
  assert.equal(result.flags.overdue_checkin, true);
  assert.match(result.flagReasons[0], /Weekly check-in missed/);
});
