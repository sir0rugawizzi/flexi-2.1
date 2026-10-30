/**
 * Joint angle and kinematic mathematics for computer vision pose tracking
 */

export interface Point2D {
  x: number;
  y: number;
  visibility?: number;
}

/**
 * Calculates the interior angle in degrees between three landmarks: (A - B - C)
 * B is the vertex point (e.g. knee between hip and ankle).
 */
export function calculateJointAngle(pointA: Point2D, pointB: Point2D, pointC: Point2D): number {
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle * 10) / 10;
}

export type SquatStage = 'UP' | 'DOWN';

export interface SquatAnalysis {
  kneeAngle: number;
  hipAngle: number;
  isProperDepth: boolean;
  formCue: string;
  formScore: number;
}

/**
 * Analyzes squat kinematics:
 * Standing: knee angle > 160 deg
 * Parallel/Good Depth: knee angle <= 100 deg (ideally 80-95 deg)
 * Quarter squat / High: knee angle > 105 deg when attempting bottom inflection
 */
export function analyzeSquatForm(hip: Point2D, knee: Point2D, ankle: Point2D, shoulder?: Point2D): SquatAnalysis {
  const kneeAngle = calculateJointAngle(hip, knee, ankle);
  const hipAngle = shoulder ? calculateJointAngle(shoulder, hip, knee) : 90;

  const isProperDepth = kneeAngle <= 100;

  let formCue = "Descend smoothly";
  let formScore = 80;

  if (kneeAngle > 155) {
    formCue = "Stand tall, prepare next rep";
    formScore = 100;
  } else if (kneeAngle <= 95) {
    formCue = "Excellent depth! Drive up through heels";
    formScore = 95;
  } else if (kneeAngle <= 110) {
    formCue = "Good depth, push a little lower";
    formScore = 85;
  } else {
    formCue = "Go lower into the squat";
    formScore = 70;
  }

  // Torso tilt safety check
  if (shoulder && hipAngle < 55) {
    formCue = "Keep chest tall, avoid excessive forward lean";
    formScore = Math.min(formScore, 65);
  }

  return {
    kneeAngle,
    hipAngle,
    isProperDepth,
    formCue,
    formScore,
  };
}

export interface PushUpAnalysis {
  elbowAngle: number;
  bodyLineAngle: number;
  isFullDepth: boolean;
  formCue: string;
  formScore: number;
}

/**
 * Push-up kinematics:
 * Top position: elbow angle > 160 deg
 * Bottom position: elbow angle <= 90 deg
 * Core alignment: shoulder - hip - ankle line should be straight (> 160 deg)
 */
export function analyzePushUpForm(
  shoulder: Point2D,
  elbow: Point2D,
  wrist: Point2D,
  hip: Point2D,
  ankle: Point2D
): PushUpAnalysis {
  const elbowAngle = calculateJointAngle(shoulder, elbow, wrist);
  const bodyLineAngle = calculateJointAngle(shoulder, hip, ankle);

  const isFullDepth = elbowAngle <= 90;
  let formCue = "Lower chest with control";
  let formScore = 85;

  if (bodyLineAngle < 150) {
    formCue = "Engage core, keep hips from sagging or piking";
    formScore = 60;
  } else if (elbowAngle > 155) {
    formCue = "Locked out at top, initiate next descent";
    formScore = 100;
  } else if (isFullDepth) {
    formCue = "Chest to deck achieved! Press back up";
    formScore = 95;
  } else {
    formCue = "Lower your chest closer to the floor";
    formScore = 75;
  }

  return {
    elbowAngle,
    bodyLineAngle,
    isFullDepth,
    formCue,
    formScore,
  };
}

export interface PlankAnalysis {
  bodyLineAngle: number;
  isAligned: boolean;
  formCue: string;
  formScore: number;
}

/**
 * Plank kinematics:
 * Ideal straight alignment: 165 - 180 degrees through shoulder - hip - ankle
 */
export function analyzePlankForm(shoulder: Point2D, hip: Point2D, ankle: Point2D): PlankAnalysis {
  const bodyLineAngle = calculateJointAngle(shoulder, hip, ankle);
  const isAligned = bodyLineAngle >= 160 && bodyLineAngle <= 180;

  let formCue = "Solid plank hold!";
  let formScore = 90;

  if (bodyLineAngle < 155) {
    formCue = "Hips are sagging! Lift hips to align with spine";
    formScore = 60;
  } else if (bodyLineAngle > 185) {
    formCue = "Hips are too high! Lower hips slightly";
    formScore = 65;
  } else {
    formCue = "Neutral spine maintained, breathe steadily";
    formScore = 95;
  }

  return {
    bodyLineAngle,
    isAligned,
    formCue,
    formScore,
  };
}
