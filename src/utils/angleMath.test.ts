import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateJointAngle,
  analyzeSquatForm,
  analyzePushUpForm,
  analyzePlankForm,
} from './angleMath';

test('calculateJointAngle calculates exact 90-degree right angle', () => {
  const pointA = { x: 0, y: 10 };
  const pointB = { x: 0, y: 0 }; // vertex
  const pointC = { x: 10, y: 0 };

  const angle = calculateJointAngle(pointA, pointB, pointC);
  assert.equal(angle, 90);
});

test('calculateJointAngle calculates straight 180-degree line', () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 }; // vertex
  const pointC = { x: 20, y: 0 };

  const angle = calculateJointAngle(pointA, pointB, pointC);
  assert.equal(angle, 180);
});

test('analyzeSquatForm distinguishes standing from deep squat depth', () => {
  // Standing: Hip (0, 100), Knee (0, 50), Ankle (0, 0)
  const standing = analyzeSquatForm(
    { x: 0, y: 100 },
    { x: 0, y: 50 },
    { x: 0, y: 0 }
  );
  assert.equal(standing.kneeAngle, 180);
  assert.equal(standing.isProperDepth, false);

  // Deep squat: Hip (30, 45), Knee (45, 50), Ankle (0, 0)
  // Knee flexion ~ 85 degrees
  const deepSquat = analyzeSquatForm(
    { x: 10, y: 50 },
    { x: 40, y: 50 },
    { x: 40, y: 0 }
  );
  assert.equal(deepSquat.kneeAngle, 90);
  assert.equal(deepSquat.isProperDepth, true);
  assert.ok(deepSquat.formScore >= 90);
});

test('analyzePushUpForm detects sagging hips as form defect', () => {
  const shoulder = { x: 0, y: 50 };
  const elbow = { x: 20, y: 60 };
  const wrist = { x: 20, y: 20 };
  const saggingHip = { x: 50, y: 20 }; // hip dropped down
  const ankle = { x: 100, y: 40 };

  const result = analyzePushUpForm(shoulder, elbow, wrist, saggingHip, ankle);
  assert.ok(result.bodyLineAngle < 155);
  assert.equal(result.formScore, 60);
  assert.match(result.formCue, /hips/i);
});

test('analyzePlankForm detects aligned neutral spine', () => {
  const shoulder = { x: 10, y: 30 };
  const hip = { x: 50, y: 30 };
  const ankle = { x: 90, y: 30 };

  const result = analyzePlankForm(shoulder, hip, ankle);
  assert.equal(result.bodyLineAngle, 180);
  assert.equal(result.isAligned, true);
  assert.equal(result.formScore, 95);
});
