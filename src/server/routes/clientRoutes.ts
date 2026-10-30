import { Router, Response } from 'express';
import { getDbAdapter } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../services/authService';
import { calculateDailyTotals, calculateAdherence } from '../../utils/macroCalc';

const router = Router();
router.use(authMiddleware);

// 1. Today Screen Command Center
router.get('/today', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const db = await getDbAdapter();

    const todayStr = new Date().toISOString().slice(0, 10);

    const [user, profile, todayMeals, workoutLogsToday, assignment] = await Promise.all([
      db.findUserById(clientId),
      db.getClientProfile(clientId),
      db.getMealLogs(clientId, todayStr),
      db.getWorkoutLogs(clientId, 5),
      db.getActiveAssignments(clientId),
    ]);

    let assignedWorkoutPlan = null;
    let assignedMealPlan = null;

    if (assignment?.workout_plan_id) {
      assignedWorkoutPlan = await db.getWorkoutPlanById(assignment.workout_plan_id);
    }
    if (assignment?.meal_plan_id) {
      assignedMealPlan = await db.getMealPlanById(assignment.meal_plan_id);
    }

    // Daily totals & progress rings
    const totals = calculateDailyTotals(todayMeals);
    const targetCalories = profile?.target_calories || 2000;
    const targetProtein = profile?.target_protein_g || 130;
    const targetCarbs = profile?.target_carbs_g || 220;
    const targetFat = profile?.target_fat_g || 65;

    const caloriePercent = Math.min(100, Math.round((totals.calories / targetCalories) * 100));
    const proteinPercent = Math.min(100, Math.round((totals.protein / targetProtein) * 100));
    const carbsPercent = Math.min(100, Math.round((totals.carbs / targetCarbs) * 100));
    const fatPercent = Math.min(100, Math.round((totals.fat / targetFat) * 100));

    // Get trainer details for direct contact
    let trainer = null;
    let trainerProfile = null;
    if (profile?.trainer_id) {
      trainer = await db.findUserById(profile.trainer_id);
      trainerProfile = await db.getTrainerProfile(profile.trainer_id);
    }

    res.json({
      user,
      profile,
      todayDate: todayStr,
      streakDays: profile?.streak_days || 0,
      macros: {
        totals,
        targets: {
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat,
        },
        percentages: {
          calories: caloriePercent,
          protein: proteinPercent,
          carbs: carbsPercent,
          fat: fatPercent,
        },
      },
      todayMeals,
      workoutLogsToday: workoutLogsToday.filter((w) => w.logged_at.slice(0, 10) === todayStr),
      assignedWorkoutPlan,
      assignedMealPlan,
      trainer: trainer ? { ...trainer, profile: trainerProfile } : null,
    });
  } catch (err: unknown) {
    console.error('[Client] Today screen error:', err);
    res.status(500).json({ error: 'Failed to retrieve today dashboard' });
  }
});

// 2. Workout Logging
router.post('/workouts/log', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const db = await getDbAdapter();
    const log = await db.logWorkout({
      client_id: clientId,
      ...req.body,
    });
    res.status(201).json(log);
  } catch (err: unknown) {
    console.error('[Client] Log workout error:', err);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

router.get('/workouts/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const logs = await db.getWorkoutLogs(req.user!.userId, 50);
    res.json(logs);
  } catch (err: unknown) {
    console.error('[Client] Workout history error:', err);
    res.status(500).json({ error: 'Failed to fetch workout history' });
  }
});

// 3. Meal Logging
router.post('/meals/log', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const db = await getDbAdapter();
    const log = await db.logMeal({
      client_id: clientId,
      ...req.body,
    });
    res.status(201).json(log);
  } catch (err: unknown) {
    console.error('[Client] Log meal error:', err);
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

router.get('/meals/today', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const todayStr = new Date().toISOString().slice(0, 10);
    const logs = await db.getMealLogs(req.user!.userId, todayStr);
    res.json(logs);
  } catch (err: unknown) {
    console.error('[Client] Today meals error:', err);
    res.status(500).json({ error: 'Failed to fetch today meals' });
  }
});

// 4. Weight Logging
router.post('/weights/log', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { weight_kg, notes } = req.body;
    if (!weight_kg) {
      res.status(400).json({ error: 'weight_kg is required' });
      return;
    }

    const db = await getDbAdapter();
    const log = await db.logWeight({
      client_id: clientId,
      weight_kg: Number(weight_kg),
      notes,
    });
    res.status(201).json(log);
  } catch (err: unknown) {
    console.error('[Client] Log weight error:', err);
    res.status(500).json({ error: 'Failed to log weight' });
  }
});

// 5. Progress Charts & Adherence History (4 Weeks)
router.get('/progress', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const db = await getDbAdapter();

    const [weights, workouts, meals, profile] = await Promise.all([
      db.getWeightLogs(clientId, 30),
      db.getWorkoutLogs(clientId, 50),
      db.getMealLogs(clientId),
      db.getClientProfile(clientId),
    ]);

    // Group meals by day for daily macro compliance timeline
    const targetCalories = profile?.target_calories || 2000;
    const dailyMealMap: Record<string, number> = {};
    meals.forEach((m) => {
      const dateKey = m.logged_at.slice(0, 10);
      dailyMealMap[dateKey] = (dailyMealMap[dateKey] || 0) + m.calories;
    });

    // Generate last 28 days timeline
    const timeline = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayCal = dailyMealMap[dateStr] || 0;
      const adherence = calculateAdherence(dayCal, targetCalories);

      // find closest weight
      const dayWeight = weights.find((w) => w.logged_at.slice(0, 10) === dateStr);
      // find workout count
      const dayWorkouts = workouts.filter((w) => w.logged_at.slice(0, 10) === dateStr);

      timeline.push({
        date: dateStr,
        calories: dayCal,
        adherencePercent: adherence,
        weightKg: dayWeight ? dayWeight.weight_kg : null,
        workoutsCompleted: dayWorkouts.length,
      });
    }

    res.json({
      targetWeightKg: profile?.target_weight_kg,
      currentWeightKg: profile?.current_weight_kg,
      targetCalories,
      timeline,
      weightHistory: weights.reverse(),
      recentWorkouts: workouts.slice(0, 10),
    });
  } catch (err: unknown) {
    console.error('[Client] Progress chart error:', err);
    res.status(500).json({ error: 'Failed to fetch progress telemetry' });
  }
});

// 6. Weekly Check-In Submission
router.post('/check-in', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { energy_score, sleep_hours, diet_adherence_score, workout_adherence_score, notes } = req.body;

    const db = await getDbAdapter();
    const checkIn = await db.submitCheckIn({
      client_id: clientId,
      week_start_date: new Date().toISOString().slice(0, 10),
      energy_score: Number(energy_score) || 7,
      sleep_hours: Number(sleep_hours) || 7,
      diet_adherence_score: Number(diet_adherence_score) || 7,
      workout_adherence_score: Number(workout_adherence_score) || 7,
      notes,
    });

    res.status(201).json(checkIn);
  } catch (err: unknown) {
    console.error('[Client] Check-in error:', err);
    res.status(500).json({ error: 'Failed to submit check-in' });
  }
});

router.get('/check-ins', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const checkIns = await db.getCheckIns(req.user!.userId);
    res.json(checkIns);
  } catch (err: unknown) {
    console.error('[Client] Get check-ins error:', err);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// 7. Messages Thread with Trainer
router.get('/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const db = await getDbAdapter();
    const profile = await db.getClientProfile(clientId);
    const trainerId = profile?.trainer_id || 'trainer-brian-01';

    const messages = await db.getMessages(clientId, trainerId);
    res.json(messages);
  } catch (err: unknown) {
    console.error('[Client] Get messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const db = await getDbAdapter();
    const profile = await db.getClientProfile(clientId);
    const trainerId = profile?.trainer_id || 'trainer-brian-01';

    const msg = await db.sendMessage({
      sender_id: clientId,
      receiver_id: trainerId,
      content,
    });
    res.status(201).json(msg);
  } catch (err: unknown) {
    console.error('[Client] Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 8. Call Request Dispatch
router.post('/call-request', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { preferred_slot, topic, channel } = req.body;
    const db = await getDbAdapter();
    const profile = await db.getClientProfile(clientId);
    const trainerId = profile?.trainer_id || 'trainer-brian-01';

    const callReq = await db.createCallRequest({
      client_id: clientId,
      trainer_id: trainerId,
      preferred_slot: preferred_slot || 'This Evening (6:00 PM)',
      topic: topic || 'Weekly Coaching Check-In',
      channel: channel || 'meet',
    });

    res.status(201).json(callReq);
  } catch (err: unknown) {
    console.error('[Client] Call request error:', err);
    res.status(500).json({ error: 'Failed to submit call request' });
  }
});

// 9. MTN / Airtel Mobile Money Subscription Simulation
router.post('/subscriptions/simulate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { network, phone_number, plan_type } = req.body;

    if (!network || !phone_number) {
      res.status(400).json({ error: 'Network (MTN/Airtel) and phone number required' });
      return;
    }

    const amount_ugx = plan_type === 'quarterly' ? 240000 : 90000;
    const reference_id = `MOMO-${network}-${Math.floor(100000 + Math.random() * 900000)}`;

    const db = await getDbAdapter();
    const subscription = await db.createSubscription({
      client_id: clientId,
      plan_type: plan_type || 'monthly',
      network: network as 'MTN' | 'AIRTEL',
      phone_number,
      amount_ugx,
      reference_id,
    });

    res.status(201).json({
      subscription,
      receipt: {
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        merchant: 'FlexiFit Uganda Co. Ltd',
        network: subscription.network,
        phone_number: subscription.phone_number,
        amount_ugx: subscription.amount_ugx,
        reference_id: subscription.reference_id,
        starts_at: subscription.starts_at,
        expires_at: subscription.expires_at,
        simulationNotice: 'Simulation, no real money moves',
      },
    });
  } catch (err: unknown) {
    console.error('[Client] Subscription error:', err);
    res.status(500).json({ error: 'Failed to complete mobile money transaction' });
  }
});

router.get('/subscription', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const sub = await db.getSubscription(req.user!.userId);
    res.json(sub);
  } catch (err: unknown) {
    console.error('[Client] Get subscription error:', err);
    res.status(500).json({ error: 'Failed to retrieve subscription status' });
  }
});

export default router;
