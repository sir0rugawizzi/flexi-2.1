import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRepTempo,
  getFormTier,
  generateVoiceCue,
} from './motionPacing';

test('calculateRepTempo flags rushing eccentric descent under 1.2s', () => {
  const result = calculateRepTempo(800, 1000);
  assert.equal(result.pacing, 'rushing');
  assert.equal(result.eccentricSeconds, 0.8);
  assert.match(result.pacingFeedback, /rushing/i);
});

test('calculateRepTempo approves optimal 2s eccentric descent', () => {
  const result = calculateRepTempo(2100, 1200);
  assert.equal(result.pacing, 'optimal');
  assert.equal(result.eccentricSeconds, 2.1);
  assert.equal(result.concentricSeconds, 1.2);
  assert.equal(result.totalDurationSeconds, 3.3);
});

test('getFormTier assigns Gold, Silver, and Bronze tiers based on scores', () => {
  assert.equal(getFormTier(95).tier, 'Gold');
  assert.equal(getFormTier(82).tier, 'Silver');
  assert.equal(getFormTier(64).tier, 'Bronze');
});

test('generateVoiceCue outputs celebration cue on reaching target reps', () => {
  const cue = generateVoiceCue(10, 'squat', 92, 10);
  assert.match(cue, /crushed/i);
});

test('generateVoiceCue prompts depth correction when form score is low', () => {
  const cue = generateVoiceCue(3, 'squat', 65, 10);
  assert.match(cue, /depth/i);
});
