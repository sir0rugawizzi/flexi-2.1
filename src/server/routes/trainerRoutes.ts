import { Router, Response } from 'express';
import { getDbAdapter } from '../db';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../services/authService';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('trainer', 'admin'));

// 1. Get Client Roster with Compliance Flags
router.get('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const db = await getDbAdapter();
    const clients = await db.getClientsForTrainer(trainerId);
    res.json(clients);
  } catch (err: unknown) {
    console.error('[Trainer] Get clients error:', err);
    res.status(500).json({ error: 'Failed to retrieve clients' });
  }
});

// 2. Get Deep Client Dossier
router.get('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;
    const db = await getDbAdapter();
    const overview = await db.getClientOverview(clientId);
    if (!overview) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const [workoutLogs, mealLogs, weightLogs, checkIns, formChecks] = await Promise.all([
      db.getWorkoutLogs(clientId, 30),
      db.getMealLogs(clientId),
      db.getWeightLogs(clientId, 30),
      db.getCheckIns(clientId),
      db.getFormChecks(clientId),
    ]);

    res.json({
      overview,
      workoutLogs,
      mealLogs,
      weightLogs,
      checkIns,
      formChecks,
    });
  } catch (err: unknown) {
    console.error('[Trainer] Get client detail error:', err);
    res.status(500).json({ error: 'Failed to fetch client dossier' });
  }
});

// 3. Workout Plans
router.get('/workout-plans', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const plans = await db.getWorkoutPlans(req.user!.userId);
    res.json(plans);
  } catch (err: unknown) {
    console.error('[Trainer] Get workout plans error:', err);
    res.status(500).json({ error: 'Failed to fetch workout plans' });
  }
});

router.post('/workout-plans', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, goal_tag, days_per_week, schedule_json } = req.body;
    if (!title || !description || !schedule_json) {
      res.status(400).json({ error: 'Title, description, and schedule required' });
      return;
    }

    const db = await getDbAdapter();
    const plan = await db.createWorkoutPlan({
      trainer_id: req.user!.userId,
      title,
      description,
      goal_tag: goal_tag || 'General Fitness',
      days_per_week: Number(days_per_week) || 3,
      schedule_json: typeof schedule_json === 'string' ? schedule_json : JSON.stringify(schedule_json),
    });

    res.status(201).json(plan);
  } catch (err: unknown) {
    console.error('[Trainer] Create workout plan error:', err);
    res.status(500).json({ error: 'Failed to create workout plan' });
  }
});

// 4. Meal Plans
router.get('/meal-plans', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const plans = await db.getMealPlans(req.user!.userId);
    res.json(plans);
  } catch (err: unknown) {
    console.error('[Trainer] Get meal plans error:', err);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

router.post('/meal-plans', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, days_json, target_calories, target_protein, target_carbs, target_fat } = req.body;
    if (!title || !days_json || !target_calories) {
      res.status(400).json({ error: 'Title, days, and target calories required' });
      return;
    }

    const db = await getDbAdapter();
    const plan = await db.createMealPlan({
      trainer_id: req.user!.userId,
      title,
      description: description || 'Custom Ugandan Meal Plan',
      days_json: typeof days_json === 'string' ? days_json : JSON.stringify(days_json),
      target_calories: Number(target_calories),
      target_protein: Number(target_protein) || 120,
      target_carbs: Number(target_carbs) || 200,
      target_fat: Number(target_fat) || 50,
    });

    res.status(201).json(plan);
  } catch (err: unknown) {
    console.error('[Trainer] Create meal plan error:', err);
    res.status(500).json({ error: 'Failed to create meal plan' });
  }
});

// 5. Assign Plans to Client
router.post('/assign-plans', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { client_id, workout_plan_id, meal_plan_id } = req.body;
    if (!client_id) {
      res.status(400).json({ error: 'client_id is required' });
      return;
    }

    const db = await getDbAdapter();
    const assignment = await db.assignPlans({
      client_id,
      workout_plan_id,
      meal_plan_id,
      assigned_by: req.user!.userId,
    });

    res.json(assignment);
  } catch (err: unknown) {
    console.error('[Trainer] Assign plans error:', err);
    res.status(500).json({ error: 'Failed to assign plans' });
  }
});

// 6. Business & Revenue Scaling Analytics
router.get('/business', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const db = await getDbAdapter();
    const profile = await db.getTrainerProfile(trainerId);
    const clients = await db.getClientsForTrainer(trainerId);

    const activeCount = clients.length;
    const monthlyRateUGX = profile?.monthly_rate_ugx || 90000;
    const inPersonRateUGX = profile?.in_person_rate_ugx || 300000;

    // Current Monthly Recurring Revenue (MRR)
    const currentMRR = activeCount * monthlyRateUGX;

    // Traditional In-person limit comparison (usually ~8 clients max before trainer burnout)
    const inPersonClientsBaseline = 8;
    const inPersonMRR = inPersonClientsBaseline * inPersonRateUGX;

    // Target FlexiFit scale model (60 clients remote with asynchronous checkins)
    const scaleGoalClients = 60;
    const projectedScaleMRR = scaleGoalClients * monthlyRateUGX;

    res.json({
      activeClientsCount: activeCount,
      monthlyRateUGX,
      inPersonRateUGX,
      currentMRR,
      inPersonComparison: {
        baselineClients: inPersonClientsBaseline,
        baselineMRR: inPersonMRR,
        revenueMultiplierVsInPerson: currentMRR > 0 ? (currentMRR / inPersonMRR).toFixed(2) : '1.0',
      },
      scalingProjection: {
        targetClients: scaleGoalClients,
        targetMRR: projectedScaleMRR,
        growthPotentialUGX: projectedScaleMRR - inPersonMRR,
      },
    });
  } catch (err: unknown) {
    console.error('[Trainer] Business view error:', err);
    res.status(500).json({ error: 'Failed to calculate business metrics' });
  }
});

// 7. Update Trainer Profile & Communication Settings
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    await db.updateTrainerProfile({
      user_id: req.user!.userId,
      ...req.body,
    });
    const updated = await db.getTrainerProfile(req.user!.userId);
    res.json(updated);
  } catch (err: unknown) {
    console.error('[Trainer] Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 8. Add feedback to a client check-in
router.put('/check-ins/:id/feedback', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const checkInId = req.params.id;
    const { feedback } = req.body;
    const db = await getDbAdapter();
    await db.updateCheckInFeedback(checkInId, feedback);
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('[Trainer] Checkin feedback error:', err);
    res.status(500).json({ error: 'Failed to submit check-in feedback' });
  }
});

export default router;
