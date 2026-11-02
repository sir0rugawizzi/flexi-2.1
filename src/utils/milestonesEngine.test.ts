import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMilestones, countEarnedMilestones } from './milestonesEngine';

test('evaluateMilestones unlocks Hydration Champion when target is reached', () => {
  const milestones = evaluateMilestones({
    waterLoggedLiters: 3.25,
    waterTargetLiters: 3.2,
    streakDays: 1,
    workoutCompletedToday: false,
    totalWorkoutsCompleted: 0,
    proteinGramsLogged: 40,
    proteinTargetGrams: 120,
  });

  const hydra = milestones.find((m) => m.id === 'hydration-champion');
  assert.ok(hydra);
  assert.equal(hydra.isUnlocked, true);
  assert.equal(hydra.currentValue, 3.25);
});

test('evaluateMilestones unlocks 2 PM Heat Shield when water is at least 1.5L', () => {
  const milestones = evaluateMilestones({
    waterLoggedLiters: 1.75,
    waterTargetLiters: 3.2,
    streakDays: 2,
    workoutCompletedToday: false,
    totalWorkoutsCompleted: 1,
    proteinGramsLogged: 50,
    proteinTargetGrams: 120,
  });

  const shield = milestones.find((m) => m.id === 'tropical-noon-shield');
  assert.ok(shield);
  assert.equal(shield.isUnlocked, true);
});

test('evaluateMilestones unlocks Consistency Beast when workout completed today', () => {
  const milestones = evaluateMilestones({
    waterLoggedLiters: 0.5,
    waterTargetLiters: 3.0,
    streakDays: 4,
    workoutCompletedToday: true,
    totalWorkoutsCompleted: 5,
    proteinGramsLogged: 100,
    proteinTargetGrams: 110,
    aiPoseScore: 94,
  });

  const workoutMilestone = milestones.find((m) => m.id === 'consistency-beast');
  assert.ok(workoutMilestone);
  assert.equal(workoutMilestone.isUnlocked, true);

  const streakMilestone = milestones.find((m) => m.id === 'streak-warrior');
  assert.ok(streakMilestone);
  assert.equal(streakMilestone.isUnlocked, true);

  const poseMilestone = milestones.find((m) => m.id === 'ai-form-master');
  assert.ok(poseMilestone);
  assert.equal(poseMilestone.isUnlocked, true);

  const stats = countEarnedMilestones(milestones);
  assert.ok(stats.earned >= 4);
});
