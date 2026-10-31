import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { IDataAdapter, UserWithPassword } from './adapter';
import {
  User,
  TrainerProfile,
  ClientProfile,
  Food,
  Exercise,
  WorkoutPlan,
  MealPlan,
  PlanAssignment,
  WorkoutLog,
  MealLog,
  WeightLog,
  CheckIn,
  Message,
  CallRequest,
  Subscription,
  PoseSession,
  FormCheck,
  ClientOverview,
} from '../../types';
import { SEED_FOODS, SEED_EXERCISES } from './seedData';
import { evaluateClientCompliance } from '../../utils/flagLogic';
import { calculate7DayAdherence, calculateDailyTotals } from '../../utils/macroCalc';

export class SQLiteAdapter implements IDataAdapter {
  private db!: Database.Database;
  private dbPath: string;

  constructor(customPath?: string) {
    this.dbPath = customPath || path.resolve(process.cwd(), 'flexifit.db');
  }

  public async init(): Promise<void> {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.createSchema();
    this.seedInitialData();
  }

  private createSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('trainer', 'client', 'admin')),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        avatar_url TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS trainer_profiles (
        user_id TEXT PRIMARY KEY,
        bio TEXT,
        specialties TEXT,
        meet_link TEXT,
        zoom_link TEXT,
        whatsapp_number TEXT,
        preferred_channel TEXT DEFAULT 'meet',
        monthly_rate_ugx INTEGER DEFAULT 90000,
        in_person_rate_ugx INTEGER DEFAULT 300000,
        verification_status TEXT DEFAULT 'pending',
        accreditation_id TEXT,
        issuing_authority TEXT,
        licence_number TEXT,
        verification_score REAL DEFAULT 0,
        otp_code TEXT,
        otp_expires_at TEXT,
        verified_at TEXT,
        documents_encrypted_json TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS client_profiles (
        user_id TEXT PRIMARY KEY,
        trainer_id TEXT,
        gender TEXT,
        dob TEXT,
        height_cm REAL,
        target_weight_kg REAL,
        current_weight_kg REAL,
        activity_level TEXT,
        fitness_goal TEXT DEFAULT 'fitness',
        target_calories INTEGER DEFAULT 2000,
        target_protein_g REAL DEFAULT 130,
        target_carbs_g REAL DEFAULT 220,
        target_fat_g REAL DEFAULT 65,
        streak_days INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        local_name TEXT,
        category TEXT NOT NULL,
        calories_100g REAL NOT NULL,
        protein_100g REAL NOT NULL,
        carbs_100g REAL NOT NULL,
        fat_100g REAL NOT NULL,
        fiber_100g REAL DEFAULT 0,
        typical_serving_g REAL NOT NULL,
        serving_unit TEXT NOT NULL,
        source TEXT NOT NULL,
        is_verified INTEGER DEFAULT 1,
        is_custom INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_muscle TEXT NOT NULL,
        secondary_muscles TEXT,
        equipment TEXT DEFAULT 'none',
        difficulty TEXT DEFAULT 'beginner',
        instructions TEXT NOT NULL,
        video_url TEXT,
        is_bodyweight INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS workout_plans (
        id TEXT PRIMARY KEY,
        trainer_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        goal_tag TEXT NOT NULL,
        days_per_week INTEGER DEFAULT 3,
        schedule_json TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meal_plans (
        id TEXT PRIMARY KEY,
        trainer_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        days_json TEXT NOT NULL,
        target_calories INTEGER NOT NULL,
        target_protein REAL NOT NULL,
        target_carbs REAL NOT NULL,
        target_fat REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS plan_assignments (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        workout_plan_id TEXT,
        meal_plan_id TEXT,
        assigned_by TEXT NOT NULL,
        assigned_at TEXT DEFAULT (datetime('now')),
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL,
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        plan_id TEXT,
        exercise_id TEXT,
        exercise_name TEXT NOT NULL,
        sets_completed INTEGER NOT NULL,
        reps_completed INTEGER NOT NULL,
        weight_kg REAL DEFAULT 0,
        duration_minutes INTEGER DEFAULT 30,
        rpe_score INTEGER,
        notes TEXT,
        logged_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meal_logs (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        grams REAL NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        logged_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS weight_logs (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        notes TEXT,
        logged_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        week_start_date TEXT NOT NULL,
        energy_score INTEGER NOT NULL,
        sleep_hours REAL NOT NULL,
        diet_adherence_score INTEGER NOT NULL,
        workout_adherence_score INTEGER NOT NULL,
        notes TEXT,
        trainer_feedback TEXT,
        status TEXT DEFAULT 'submitted',
        submitted_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        content TEXT NOT NULL,
        attachment_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS call_requests (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        trainer_id TEXT NOT NULL,
        preferred_slot TEXT NOT NULL,
        topic TEXT NOT NULL,
        channel TEXT DEFAULT 'meet',
        status TEXT DEFAULT 'pending',
        meeting_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        plan_type TEXT NOT NULL,
        network TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        amount_ugx INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        reference_id TEXT NOT NULL,
        starts_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pose_sessions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        exercise TEXT NOT NULL,
        reps_completed INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        avg_form_score REAL NOT NULL,
        rep_durations_json TEXT,
        angles_log_json TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS form_checks (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        exercise TEXT NOT NULL,
        video_path TEXT NOT NULL,
        thumbnail_path TEXT,
        ai_score INTEGER NOT NULL,
        ai_good_json TEXT NOT NULL,
        ai_fixes_json TEXT NOT NULL,
        ai_safety_note TEXT NOT NULL,
        ai_cue TEXT NOT NULL,
        trainer_comment TEXT,
        trainer_commented_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_workout_logs_client ON workout_logs(client_id, logged_at);
      CREATE INDEX IF NOT EXISTS idx_meal_logs_client ON meal_logs(client_id, logged_at);
      CREATE INDEX IF NOT EXISTS idx_weight_logs_client ON weight_logs(client_id, logged_at);
      CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
    `);

    // Safe column migrations for existing databases
    const safeAlter = (sql: string) => {
      try {
        this.db.exec(sql);
      } catch {}
    };

    safeAlter("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN verification_status TEXT DEFAULT 'pending'");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN accreditation_id TEXT");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN issuing_authority TEXT");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN licence_number TEXT");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN verification_score REAL DEFAULT 0");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN otp_code TEXT");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN otp_expires_at TEXT");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN verified_at TEXT");
    safeAlter("ALTER TABLE trainer_profiles ADD COLUMN documents_encrypted_json TEXT");
  }

  private seedInitialData(): void {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) {
      // Ensure Coach Brian is verified in existing databases
      try {
        this.db.prepare(`
          UPDATE users SET is_verified = 1 WHERE id = 'trainer-brian-01'
        `).run();
        this.db.prepare(`
          UPDATE trainer_profiles 
          SET verification_status = 'verified', 
              accreditation_id = 'UG-CPT-2024-UOC01',
              issuing_authority = 'Uganda Olympic Committee & National Fitness Accreditation Board',
              licence_number = 'UOC-FT-8842',
              verification_score = 98.5,
              verified_at = datetime('now', '-60 days')
          WHERE user_id = 'trainer-brian-01'
        `).run();
      } catch {}
      return; // Database already seeded
    }

    // Deterministic hash for 'password123'
    const defaultHash = '$2b$10$HjLCBDhFeXRmCLzG/mZXpuiF9LEcYFMieocL3eW64C6M4MIrEe3sy';

    // 1. Seed Trainer: Coach Brian
    const trainerId = 'trainer-brian-01';
    this.db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, phone, avatar_url, is_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now', '-60 days'))
    `).run(
      trainerId,
      'brian@flexifit.ug',
      defaultHash,
      'trainer',
      'Coach Brian Mukasa',
      '+256701234567',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'
    );

    this.db.prepare(`
      INSERT INTO trainer_profiles (user_id, bio, specialties, meet_link, zoom_link, whatsapp_number, preferred_channel, monthly_rate_ugx, in_person_rate_ugx, verification_status, accreditation_id, issuing_authority, licence_number, verification_score, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', 'UG-CPT-2024-UOC01', 'Uganda Olympic Committee & National Fitness Accreditation Board', 'UOC-FT-8842', 98.5, datetime('now', '-60 days'))
    `).run(
      trainerId,
      'Certified Strength & Conditioning Specialist with 8+ years coaching Kampala urban professionals in sustainable home training and indigenous nutrition.',
      'Hypertrophy, Functional Movement, Weight Loss, Posture',
      'https://meet.google.com/new',
      'https://zoom.us/j/flexifituganda',
      '256701234567',
      'meet',
      90000,
      300000
    );

    // 2. Seed Foods
    const insertFood = this.db.prepare(`
      INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    SEED_FOODS.forEach((f, idx) => {
      insertFood.run(
        `food-${idx + 1}`,
        f.name,
        f.local_name || null,
        f.category,
        f.calories_100g,
        f.protein_100g,
        f.carbs_100g,
        f.fat_100g,
        f.fiber_100g || 0,
        f.typical_serving_g,
        f.serving_unit,
        f.source,
        f.is_verified ? 1 : 0,
        0
      );
    });

    // 3. Seed Exercises
    const insertExercise = this.db.prepare(`
      INSERT INTO exercises (id, name, target_muscle, secondary_muscles, equipment, difficulty, instructions, video_url, is_bodyweight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    SEED_EXERCISES.forEach((ex, idx) => {
      insertExercise.run(
        `ex-${idx + 1}`,
        ex.name,
        ex.target_muscle,
        ex.secondary_muscles || null,
        ex.equipment,
        ex.difficulty,
        ex.instructions,
        ex.video_url || null,
        ex.is_bodyweight ? 1 : 0
      );
    });

    // 4. Seed Standard Workout Plans
    const workoutPlanId1 = 'plan-workout-fullbody';
    const schedule1 = JSON.stringify([
      {
        day_number: 1,
        day_name: 'Monday: Lower Body Power & Core',
        exercises: [
          { exercise_id: 'ex-1', exercise_name: 'Bodyweight Squats', sets: 4, reps: 15, rest_seconds: 60 },
          { exercise_id: 'ex-4', exercise_name: 'Walking Lunges', sets: 3, reps: 12, rest_seconds: 60 },
          { exercise_id: 'ex-3', exercise_name: 'Forearm Plank Hold', sets: 3, reps: 45, rest_seconds: 45 },
        ],
      },
      {
        day_number: 3,
        day_name: 'Wednesday: Upper Body Push & Stability',
        exercises: [
          { exercise_id: 'ex-2', exercise_name: 'Push-Ups (Standard / Incline)', sets: 4, reps: 12, rest_seconds: 60 },
          { exercise_id: 'ex-7', exercise_name: 'Chair / Couch Dips', sets: 3, reps: 12, rest_seconds: 60 },
          { exercise_id: 'ex-6', exercise_name: 'Mountain Climbers', sets: 3, reps: 20, rest_seconds: 45 },
        ],
      },
      {
        day_number: 5,
        day_name: 'Friday: Posterior Chain & HIIT Finish',
        exercises: [
          { exercise_id: 'ex-5', exercise_name: 'Glute Bridges', sets: 4, reps: 15, rest_seconds: 45 },
          { exercise_id: 'ex-8', exercise_name: 'Wall Sit Isometric Hold', sets: 3, reps: 45, rest_seconds: 60 },
          { exercise_id: 'ex-9', exercise_name: 'Jump Rope / Invisible Skipping', sets: 3, reps: 50, rest_seconds: 30 },
        ],
      },
    ]);

    this.db.prepare(`
      INSERT INTO workout_plans (id, trainer_id, title, description, goal_tag, days_per_week, schedule_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      workoutPlanId1,
      trainerId,
      'Kampala Home Strength & Tone',
      '3-day zero-equipment progressive overload program targeting posture, core rigidity, and functional strength for busy professionals.',
      'General Fitness',
      3,
      schedule1
    );

    // 5. Seed Standard Meal Plans
    const mealPlanId1 = 'plan-meal-balanced';
    const mealSchedule1 = JSON.stringify([
      {
        day_number: 1,
        day_name: 'Everyday Balanced Ugandan Nutrition',
        meals: [
          { meal_type: 'breakfast', food_id: 'food-8', food_name: 'Maize Flour Porridge (Uji)', serving_grams: 250, calories: 162, protein: 3.5, carbs: 35, fat: 1.2 },
          { meal_type: 'breakfast', food_id: 'food-28', food_name: 'Boiled Egg', serving_grams: 100, calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6 },
          { meal_type: 'lunch', food_id: 'food-1', food_name: 'Steamed Matooke', serving_grams: 200, calories: 244, protein: 2.6, carbs: 59.2, fat: 0.8 },
          { meal_type: 'lunch', food_id: 'food-12', food_name: 'Stewed Yellow Beans', serving_grams: 150, calories: 187, protein: 12.3, carbs: 32.2, fat: 0.9 },
          { meal_type: 'lunch', food_id: 'food-29', food_name: 'Dodo (Amaranth Greens Steamed)', serving_grams: 120, calories: 42, protein: 3.8, carbs: 6.6, fat: 0.5 },
          { meal_type: 'dinner', food_id: 'food-19', food_name: 'Fresh Tilapia (Steamed / Boiled)', serving_grams: 180, calories: 172, protein: 36.1, carbs: 0, fat: 3.0 },
          { meal_type: 'dinner', food_id: 'food-4', food_name: 'Posho (Ugali / Maize Meal)', serving_grams: 150, calories: 217, protein: 4.6, carbs: 46.5, fat: 0.9 },
          { meal_type: 'dinner', food_id: 'food-30', food_name: 'Sukuma Wiki (Collard Greens Sauteed)', serving_grams: 120, calories: 54, protein: 3.3, carbs: 7.4, fat: 1.4 },
        ],
      },
    ]);

    this.db.prepare(`
      INSERT INTO meal_plans (id, trainer_id, title, description, days_json, target_calories, target_protein, target_carbs, target_fat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mealPlanId1,
      trainerId,
      'High-Protein Indigenous Vitality Plan',
      'Whole-food Ugandan nutrition plan combining slow-burning starches (Matooke & Posho) with lean Lake Victoria fish and iron-rich green leafy vegetables.',
      mealSchedule1,
      2050,
      135,
      220,
      60
    );

    // 6. Seed 6 Ugandan Clients with diverse goals & compliance states
    const clientsData = [
      {
        id: 'client-ronald-01',
        email: 'ronald@flexifit.ug',
        name: 'Kato Ronald',
        phone: '+256772111222',
        goal: 'muscle_gain',
        target_wt: 78,
        curr_wt: 74.5,
        target_cal: 2400,
        streak: 0,
        flagType: 'missed_workouts', // No workout in 4 days!
      },
      {
        id: 'client-sarah-02',
        email: 'sarah@flexifit.ug',
        name: 'Namubiru Sarah',
        phone: '+256782333444',
        goal: 'weight_loss',
        target_wt: 65,
        curr_wt: 73.2,
        target_cal: 1700,
        streak: 3,
        flagType: 'nutrition_deficit', // Macro adherence at 58%
      },
      {
        id: 'client-david-03',
        email: 'david@flexifit.ug',
        name: 'Ochieng David',
        phone: '+256752555666',
        goal: 'fitness',
        target_wt: 82,
        curr_wt: 84.0,
        target_cal: 2100,
        streak: 2,
        flagType: 'stale_weight', // No weight in 10 days
      },
      {
        id: 'client-grace-04',
        email: 'grace@flexifit.ug',
        name: 'Akello Grace',
        phone: '+256702777888',
        goal: 'weight_loss',
        target_wt: 62,
        curr_wt: 68.5,
        target_cal: 1650,
        streak: 1,
        flagType: 'overdue_checkin', // Missed check-in
      },
      {
        id: 'client-ivan-05',
        email: 'ivan@flexifit.ug',
        name: 'Mugisha Ivan',
        phone: '+256782999000',
        goal: 'muscle_gain',
        target_wt: 80,
        curr_wt: 79.2,
        target_cal: 2500,
        streak: 14,
        flagType: 'on_track', // Fully compliant!
      },
      {
        id: 'client-flavia-06',
        email: 'flavia@flexifit.ug',
        name: 'Nabakooza Flavia',
        phone: '+256772123987',
        goal: 'fitness',
        target_wt: 60,
        curr_wt: 61.2,
        target_cal: 1900,
        streak: 5,
        flagType: 'borderline', // 72% adherence, recent workouts
      },
    ];

    clientsData.forEach((c) => {
      this.db.prepare(`
        INSERT INTO users (id, email, password_hash, role, name, phone, created_at)
        VALUES (?, ?, ?, 'client', ?, ?, datetime('now', '-35 days'))
      `).run(c.id, c.email, defaultHash, c.name, c.phone);

      this.db.prepare(`
        INSERT INTO client_profiles (user_id, trainer_id, target_weight_kg, current_weight_kg, fitness_goal, target_calories, target_protein_g, target_carbs_g, target_fat_g, streak_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        c.id,
        trainerId,
        c.target_wt,
        c.curr_wt,
        c.goal,
        c.target_cal,
        Math.round(c.target_cal * 0.25 / 4),
        Math.round(c.target_cal * 0.50 / 4),
        Math.round(c.target_cal * 0.25 / 9),
        c.streak
      );

      // Assign plans
      this.db.prepare(`
        INSERT INTO plan_assignments (id, client_id, workout_plan_id, meal_plan_id, assigned_by, assigned_at, is_active)
        VALUES (?, ?, ?, ?, ?, datetime('now', '-30 days'), 1)
      `).run(`assign-${c.id}`, c.id, workoutPlanId1, mealPlanId1, trainerId);

      // Seed 4 weeks of logs according to client flag condition
      this.seedClientHistory(c.id, c.flagType, c.target_cal, c.curr_wt, trainerId);
    });
  }

  private seedClientHistory(
    clientId: string,
    flagType: string,
    targetCalories: number,
    baseWeight: number,
    trainerId: string
  ): void {
    const insertWorkout = this.db.prepare(`
      INSERT INTO workout_logs (id, client_id, exercise_name, sets_completed, reps_completed, weight_kg, duration_minutes, rpe_score, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMeal = this.db.prepare(`
      INSERT INTO meal_logs (id, client_id, meal_type, food_name, grams, calories, protein, carbs, fat, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertWeight = this.db.prepare(`
      INSERT INTO weight_logs (id, client_id, weight_kg, notes, logged_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertCheckIn = this.db.prepare(`
      INSERT INTO check_ins (id, client_id, week_start_date, energy_score, sleep_hours, diet_adherence_score, workout_adherence_score, notes, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Workouts
    // For Kato Ronald (flagType === 'missed_workouts'), last workout was 4 days ago!
    // For others, workouts logged 1-2 days ago.
    const lastWorkoutOffset = flagType === 'missed_workouts' ? 4 : 1;
    for (let day = 28; day >= lastWorkoutOffset; day -= 2) {
      insertWorkout.run(
        `wlog-${clientId}-${day}`,
        clientId,
        day % 4 === 0 ? 'Bodyweight Squats' : 'Push-Ups (Standard / Incline)',
        3,
        15,
        0,
        35,
        8,
        `datetime('now', '-${day} days', '18:30:00')`
      );
    }

    // 2. Meals
    // For Sarah (flagType === 'nutrition_deficit'), calorie adherence is low (~58% of target)
    // For Ivan / on-track, adherence is ~95%.
    const calorieMultiplier = flagType === 'nutrition_deficit' ? 0.58 : 0.95;
    for (let day = 28; day >= 1; day--) {
      const dayCal = targetCalories * calorieMultiplier * (0.95 + (day % 3) * 0.05);
      insertMeal.run(
        `mlog-${clientId}-${day}-lunch`,
        clientId,
        'lunch',
        'Steamed Matooke with Yellow Beans',
        350,
        Math.round(dayCal * 0.5),
        Math.round(dayCal * 0.5 * 0.2 / 4),
        Math.round(dayCal * 0.5 * 0.6 / 4),
        Math.round(dayCal * 0.5 * 0.2 / 9),
        `datetime('now', '-${day} days', '13:00:00')`
      );
      insertMeal.run(
        `mlog-${clientId}-${day}-dinner`,
        clientId,
        'dinner',
        'Tilapia with Posho & Sukuma',
        400,
        Math.round(dayCal * 0.5),
        Math.round(dayCal * 0.5 * 0.3 / 4),
        Math.round(dayCal * 0.5 * 0.5 / 4),
        Math.round(dayCal * 0.5 * 0.2 / 9),
        `datetime('now', '-${day} days', '20:00:00')`
      );
    }

    // 3. Weight Logs
    // For David (flagType === 'stale_weight'), last weight was 10 days ago!
    const lastWeightOffset = flagType === 'stale_weight' ? 10 : 2;
    for (let day = 28; day >= lastWeightOffset; day -= 7) {
      const wtShift = (28 - day) * 0.1;
      insertWeight.run(
        `wtlog-${clientId}-${day}`,
        clientId,
        Math.round((baseWeight - wtShift) * 10) / 10,
        'Morning fasted weight check',
        `datetime('now', '-${day} days', '07:15:00')`
      );
    }

    // 4. Weekly Check-Ins
    // For Grace (flagType === 'overdue_checkin'), last check-in was 10 days ago!
    const lastCheckinOffset = flagType === 'overdue_checkin' ? 10 : 3;
    insertCheckIn.run(
      `cin-${clientId}-1`,
      clientId,
      `datetime('now', '-${lastCheckinOffset + 14} days')`,
      8,
      7.5,
      8,
      9,
      'Felt strong this week, high energy on work days.',
      'reviewed',
      `datetime('now', '-${lastCheckinOffset + 7} days')`
    );
    if (flagType !== 'overdue_checkin') {
      insertCheckIn.run(
        `cin-${clientId}-2`,
        clientId,
        `datetime('now', '-${lastCheckinOffset + 7} days')`,
        7,
        6.5,
        flagType === 'nutrition_deficit' ? 5 : 9,
        8,
        'Managing workloads well, staying hydrated.',
        'submitted',
        `datetime('now', '-${lastCheckinOffset} days')`
      );
    }

    // 5. Chat Messages with Coach Brian
    this.db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now', '-3 days', '10:00:00'))
    `).run(`msg-${clientId}-1`, trainerId, clientId, 'Hey! How did your lower body session feel this week?');

    this.db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now', '-2 days', '14:20:00'))
    `).run(`msg-${clientId}-2`, clientId, trainerId, 'Coach, the squats felt much smoother! Kept my knees tracking out.');

    // 6. Form Check Submissions (sample AI analysis)
    this.db.prepare(`
      INSERT INTO form_checks (id, client_id, exercise, video_path, ai_score, ai_good_json, ai_fixes_json, ai_safety_note, ai_cue, trainer_comment, trainer_commented_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-5 days'), datetime('now', '-6 days'))
    `).run(
      `fc-${clientId}-1`,
      clientId,
      'Bodyweight Squats',
      '/uploads/sample_squat.mp4',
      8,
      JSON.stringify(['Knees stayed aligned with toes', 'Solid pelvic stability at bottom']),
      JSON.stringify(['Heels lifted slightly on rep 4', 'Depth was 2 inches above parallel on first 2 reps']),
      'Ensure mid-foot pressure remains grounded to protect knees.',
      'Screw feet into the floor and sit back into your hips.',
      'Great work! Try widening your stance by 1 inch next time.',
    );

    // 7. Active Subscriptions (Simulated Mobile Money)
    this.db.prepare(`
      INSERT INTO subscriptions (id, client_id, plan_type, network, phone_number, amount_ugx, status, reference_id, starts_at, expires_at)
      VALUES (?, ?, 'monthly', 'MTN', '+256772111222', 90000, 'active', ?, datetime('now', '-15 days'), datetime('now', '+15 days'))
    `).run(`sub-${clientId}`, clientId, `MOMO-REF-${Math.floor(100000 + Math.random() * 900000)}`);
  }

  // Auth & User methods
  public async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as UserWithPassword | undefined;
    return row || null;
  }

  public async findUserById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT id, email, role, name, phone, avatar_url, is_verified, created_at FROM users WHERE id = ?').get(id) as (User & { is_verified?: number }) | undefined;
    if (!row) return null;
    return {
      ...row,
      is_verified: Boolean(row.is_verified),
    };
  }

  public async createUser(userData: {
    email: string;
    password_hash: string;
    role: 'trainer' | 'client' | 'admin';
    name: string;
    phone: string;
    avatar_url?: string;
    is_verified?: boolean;
  }): Promise<User> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    this.db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, phone, avatar_url, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userData.email,
      userData.password_hash,
      userData.role,
      userData.name,
      userData.phone,
      userData.avatar_url || null,
      userData.is_verified ? 1 : 0
    );

    if (userData.role === 'trainer') {
      this.db.prepare(`
        INSERT INTO trainer_profiles (user_id, meet_link, preferred_channel, monthly_rate_ugx, in_person_rate_ugx, verification_status)
        VALUES (?, 'https://meet.google.com/new', 'meet', 90000, 300000, ?)
      `).run(id, userData.is_verified ? 'verified' : 'pending');
    } else {
      this.db.prepare(`
        INSERT INTO client_profiles (user_id, trainer_id, fitness_goal, target_calories, target_protein_g, target_carbs_g, target_fat_g, streak_days)
        VALUES (?, 'trainer-brian-01', 'fitness', 2000, 130, 220, 65, 0)
      `).run(id);
    }

    const created = await this.findUserById(id);
    return created!;
  }

  public async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    Object.entries(data).forEach(([key, val]) => {
      if (key !== 'id' && val !== undefined) {
        if (key === 'is_verified') {
          fields.push(`${key} = ?`);
          values.push(val ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      }
    });
    if (fields.length > 0) {
      values.push(userId);
      this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  public async saveCoachVerification(data: {
    userId: string;
    verificationStatus: string;
    accreditationId: string;
    issuingAuthority: string;
    licenceNumber?: string;
    verificationScore: number;
    otpCode: string;
    otpExpiresAt: string;
    documentsEncryptedJson: string;
  }): Promise<void> {
    this.db.prepare(`
      UPDATE trainer_profiles
      SET verification_status = ?,
          accreditation_id = ?,
          issuing_authority = ?,
          licence_number = ?,
          verification_score = ?,
          otp_code = ?,
          otp_expires_at = ?,
          documents_encrypted_json = ?
      WHERE user_id = ?
    `).run(
      data.verificationStatus,
      data.accreditationId,
      data.issuingAuthority,
      data.licenceNumber || 'UOC-REG-' + Math.floor(1000 + Math.random() * 9000),
      data.verificationScore,
      data.otpCode,
      data.otpExpiresAt,
      data.documentsEncryptedJson,
      data.userId
    );
  }

  public async verifyCoachOtp(userId: string, otpCode: string): Promise<boolean> {
    const row = this.db.prepare(`
      SELECT otp_code, otp_expires_at FROM trainer_profiles WHERE user_id = ?
    `).get(userId) as { otp_code?: string; otp_expires_at?: string } | undefined;

    if (!row || !row.otp_code) return false;

    // Check expiration and code match
    const isExpired = row.otp_expires_at ? new Date(row.otp_expires_at).getTime() < Date.now() : false;
    if (isExpired) return false;

    if (row.otp_code.trim() === otpCode.trim()) {
      // Mark coach as verified in both users and trainer_profiles
      this.db.prepare(`
        UPDATE users SET is_verified = 1 WHERE id = ?
      `).run(userId);

      this.db.prepare(`
        UPDATE trainer_profiles
        SET verification_status = 'verified',
            verified_at = datetime('now'),
            otp_code = NULL
        WHERE user_id = ?
      `).run(userId);

      return true;
    }
    return false;
  }

  public async getTrainerProfile(userId: string): Promise<TrainerProfile | null> {
    const row = this.db.prepare('SELECT * FROM trainer_profiles WHERE user_id = ?').get(userId) as TrainerProfile | undefined;
    return row || null;
  }

  public async updateTrainerProfile(profile: Partial<TrainerProfile> & { user_id: string }): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    Object.entries(profile).forEach(([key, val]) => {
      if (key !== 'user_id' && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });
    if (fields.length > 0) {
      values.push(profile.user_id);
      this.db.prepare(`UPDATE trainer_profiles SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    }
  }

  public async getClientProfile(userId: string): Promise<ClientProfile | null> {
    const row = this.db.prepare('SELECT * FROM client_profiles WHERE user_id = ?').get(userId) as ClientProfile | undefined;
    return row || null;
  }

  public async updateClientProfile(profile: Partial<ClientProfile> & { user_id: string }): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    Object.entries(profile).forEach(([key, val]) => {
      if (key !== 'user_id' && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });
    if (fields.length > 0) {
      values.push(profile.user_id);
      this.db.prepare(`UPDATE client_profiles SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    }
  }

  public async getClientsForTrainer(trainerId: string): Promise<ClientOverview[]> {
    const clientRows = this.db.prepare(`
      SELECT u.id, u.email, u.role, u.name, u.phone, u.avatar_url, u.created_at,
             cp.fitness_goal, cp.target_weight_kg, cp.current_weight_kg, cp.target_calories,
             cp.target_protein_g, cp.target_carbs_g, cp.target_fat_g, cp.streak_days
      FROM users u
      JOIN client_profiles cp ON u.id = cp.user_id
      WHERE cp.trainer_id = ?
    `).all(trainerId) as (User & ClientProfile)[];

    const overviews: ClientOverview[] = [];
    for (const c of clientRows) {
      const overview = await this.buildClientOverview(c.id, c);
      if (overview) overviews.push(overview);
    }

    return overviews;
  }

  public async getClientOverview(clientId: string): Promise<ClientOverview | null> {
    const user = await this.findUserById(clientId);
    if (!user) return null;
    const profile = await this.getClientProfile(clientId);
    if (!profile) return null;

    return this.buildClientOverview(clientId, { ...user, ...profile });
  }

  private async buildClientOverview(clientId: string, combinedData: User & ClientProfile): Promise<ClientOverview> {
    // 1. Last workout
    const lastWorkout = this.db.prepare(`
      SELECT logged_at FROM workout_logs WHERE client_id = ? ORDER BY logged_at DESC LIMIT 1
    `).get(clientId) as { logged_at: string } | undefined;

    // 2. Last weight
    const lastWeight = this.db.prepare(`
      SELECT logged_at FROM weight_logs WHERE client_id = ? ORDER BY logged_at DESC LIMIT 1
    `).get(clientId) as { logged_at: string } | undefined;

    // 3. Last check-in
    const lastCheckin = this.db.prepare(`
      SELECT submitted_at FROM check_ins WHERE client_id = ? ORDER BY submitted_at DESC LIMIT 1
    `).get(clientId) as { submitted_at: string } | undefined;

    // 4. 7-day macro adherence
    const recentMeals = this.db.prepare(`
      SELECT calories, logged_at FROM meal_logs
      WHERE client_id = ? AND logged_at >= datetime('now', '-7 days')
    `).all(clientId) as { calories: number; logged_at: string }[];

    // Group meals by day to sum daily calories
    const dayTotals: Record<string, number> = {};
    recentMeals.forEach((m) => {
      const dayKey = m.logged_at.slice(0, 10);
      dayTotals[dayKey] = (dayTotals[dayKey] || 0) + m.calories;
    });

    const targetCal = combinedData.target_calories || 2000;
    const dailyIntakeValues = Object.values(dayTotals);
    // If fewer than 7 days logged, include zero days for strict evaluation
    while (dailyIntakeValues.length < 7) {
      dailyIntakeValues.push(0);
    }
    const macroAdherence7d = calculate7DayAdherence(dailyIntakeValues, targetCal);

    // 5. Evaluate flags
    const evalResult = evaluateClientCompliance({
      lastWorkoutDate: lastWorkout?.logged_at,
      sevenDayMacroAdherence: macroAdherence7d,
      lastWeightDate: lastWeight?.logged_at,
      lastCheckInDate: lastCheckin?.submitted_at,
    });

    // Active plans
    const activeAssign = await this.getActiveAssignments(clientId);
    let activeWorkoutPlan: WorkoutPlan | undefined;
    let activeMealPlan: MealPlan | undefined;

    if (activeAssign?.workout_plan_id) {
      activeWorkoutPlan = (await this.getWorkoutPlanById(activeAssign.workout_plan_id)) || undefined;
    }
    if (activeAssign?.meal_plan_id) {
      activeMealPlan = (await this.getMealPlanById(activeAssign.meal_plan_id)) || undefined;
    }

    return {
      user: {
        id: combinedData.id,
        email: combinedData.email,
        role: combinedData.role,
        name: combinedData.name,
        phone: combinedData.phone,
        avatar_url: combinedData.avatar_url,
        created_at: combinedData.created_at,
      },
      profile: {
        user_id: combinedData.user_id,
        trainer_id: combinedData.trainer_id,
        gender: combinedData.gender,
        dob: combinedData.dob,
        height_cm: combinedData.height_cm,
        target_weight_kg: combinedData.target_weight_kg,
        current_weight_kg: combinedData.current_weight_kg,
        activity_level: combinedData.activity_level,
        fitness_goal: combinedData.fitness_goal,
        target_calories: combinedData.target_calories,
        target_protein_g: combinedData.target_protein_g,
        target_carbs_g: combinedData.target_carbs_g,
        target_fat_g: combinedData.target_fat_g,
        streak_days: combinedData.streak_days,
      },
      is_flagged: evalResult.isFlagged,
      flags: evalResult.flags,
      flag_reasons: evalResult.flagReasons,
      last_workout_date: lastWorkout?.logged_at,
      last_weight_date: lastWeight?.logged_at,
      last_checkin_date: lastCheckin?.submitted_at,
      macro_adherence_7d: macroAdherence7d,
      active_workout_plan: activeWorkoutPlan,
      active_meal_plan: activeMealPlan,
    };
  }

  // Foods
  public async getFoods(search?: string, category?: string): Promise<Food[]> {
    let sql = 'SELECT * FROM foods WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(local_name) LIKE ?)';
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY name ASC';
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      ...r,
      is_verified: Boolean(r.is_verified),
      is_custom: Boolean(r.is_custom),
    })) as Food[];
  }

  public async getFoodById(id: string): Promise<Food | null> {
    const row = this.db.prepare('SELECT * FROM foods WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_verified: Boolean(row.is_verified),
      is_custom: Boolean(row.is_custom),
    } as Food;
  }

  public async createFood(food: Omit<Food, 'id'>): Promise<Food> {
    const id = `food-custom-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      food.name,
      food.local_name || null,
      food.category,
      food.calories_100g,
      food.protein_100g,
      food.carbs_100g,
      food.fat_100g,
      food.fiber_100g || 0,
      food.typical_serving_g,
      food.serving_unit,
      food.source || 'Trainer Custom Food',
      0
    );
    return (await this.getFoodById(id))!;
  }

  // Exercises
  public async getExercises(muscle?: string, equipment?: string): Promise<Exercise[]> {
    let sql = 'SELECT * FROM exercises WHERE 1=1';
    const params: unknown[] = [];
    if (muscle) {
      sql += ' AND LOWER(target_muscle) LIKE ?';
      params.push(`%${muscle.toLowerCase()}%`);
    }
    if (equipment) {
      sql += ' AND equipment = ?';
      params.push(equipment);
    }
    sql += ' ORDER BY name ASC';
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      ...r,
      is_bodyweight: Boolean(r.is_bodyweight),
    })) as Exercise[];
  }

  public async getExerciseById(id: string): Promise<Exercise | null> {
    const row = this.db.prepare('SELECT * FROM exercises WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_bodyweight: Boolean(row.is_bodyweight),
    } as Exercise;
  }

  // Workout Plans
  public async getWorkoutPlans(trainerId: string): Promise<WorkoutPlan[]> {
    const rows = this.db.prepare('SELECT * FROM workout_plans WHERE trainer_id = ? ORDER BY created_at DESC').all(trainerId) as WorkoutPlan[];
    return rows;
  }

  public async getWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
    const row = this.db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(id) as WorkoutPlan | undefined;
    return row || null;
  }

  public async createWorkoutPlan(plan: {
    trainer_id: string;
    title: string;
    description: string;
    goal_tag: string;
    days_per_week: number;
    schedule_json: string;
  }): Promise<WorkoutPlan> {
    const id = `plan-w-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO workout_plans (id, trainer_id, title, description, goal_tag, days_per_week, schedule_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, plan.trainer_id, plan.title, plan.description, plan.goal_tag, plan.days_per_week, plan.schedule_json);
    return (await this.getWorkoutPlanById(id))!;
  }

  // Meal Plans
  public async getMealPlans(trainerId: string): Promise<MealPlan[]> {
    const rows = this.db.prepare('SELECT * FROM meal_plans WHERE trainer_id = ? ORDER BY created_at DESC').all(trainerId) as MealPlan[];
    return rows;
  }

  public async getMealPlanById(id: string): Promise<MealPlan | null> {
    const row = this.db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id) as MealPlan | undefined;
    return row || null;
  }

  public async createMealPlan(plan: {
    trainer_id: string;
    title: string;
    description: string;
    days_json: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
  }): Promise<MealPlan> {
    const id = `plan-m-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO meal_plans (id, trainer_id, title, description, days_json, target_calories, target_protein, target_carbs, target_fat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      plan.trainer_id,
      plan.title,
      plan.description,
      plan.days_json,
      plan.target_calories,
      plan.target_protein,
      plan.target_carbs,
      plan.target_fat
    );
    return (await this.getMealPlanById(id))!;
  }

  // Assignments
  public async assignPlans(assignment: {
    client_id: string;
    workout_plan_id?: string;
    meal_plan_id?: string;
    assigned_by: string;
  }): Promise<PlanAssignment> {
    const id = `assign-${Date.now()}`;
    // Deactivate old active assignments
    this.db.prepare('UPDATE plan_assignments SET is_active = 0 WHERE client_id = ?').run(assignment.client_id);

    this.db.prepare(`
      INSERT INTO plan_assignments (id, client_id, workout_plan_id, meal_plan_id, assigned_by, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, assignment.client_id, assignment.workout_plan_id || null, assignment.meal_plan_id || null, assignment.assigned_by);

    const row = this.db.prepare('SELECT * FROM plan_assignments WHERE id = ?').get(id) as PlanAssignment;
    return row;
  }

  public async getActiveAssignments(clientId: string): Promise<PlanAssignment | null> {
    const row = this.db.prepare('SELECT * FROM plan_assignments WHERE client_id = ? AND is_active = 1 LIMIT 1').get(clientId) as PlanAssignment | undefined;
    return row || null;
  }

  // Logs
  public async logWorkout(log: {
    client_id: string;
    plan_id?: string;
    exercise_id?: string;
    exercise_name: string;
    sets_completed: number;
    reps_completed: number;
    weight_kg: number;
    duration_minutes: number;
    rpe_score?: number;
    notes?: string;
    logged_at?: string;
  }): Promise<WorkoutLog> {
    const id = `wlog-${Date.now()}`;
    const loggedAt = log.logged_at || new Date().toISOString();
    this.db.prepare(`
      INSERT INTO workout_logs (id, client_id, plan_id, exercise_id, exercise_name, sets_completed, reps_completed, weight_kg, duration_minutes, rpe_score, notes, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      log.client_id,
      log.plan_id || null,
      log.exercise_id || null,
      log.exercise_name,
      log.sets_completed,
      log.reps_completed,
      log.weight_kg,
      log.duration_minutes,
      log.rpe_score || null,
      log.notes || null,
      loggedAt
    );
    // Increment client streak
    this.db.prepare('UPDATE client_profiles SET streak_days = streak_days + 1 WHERE user_id = ?').run(log.client_id);

    const row = this.db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(id) as WorkoutLog;
    return row;
  }

  public async getWorkoutLogs(clientId: string, limit = 50): Promise<WorkoutLog[]> {
    const rows = this.db.prepare('SELECT * FROM workout_logs WHERE client_id = ? ORDER BY logged_at DESC LIMIT ?').all(clientId, limit) as WorkoutLog[];
    return rows;
  }

  public async logMeal(log: {
    client_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_id?: string;
    food_name: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    logged_at?: string;
  }): Promise<MealLog> {
    const id = `mlog-${Date.now()}`;
    const loggedAt = log.logged_at || new Date().toISOString();
    this.db.prepare(`
      INSERT INTO meal_logs (id, client_id, meal_type, food_id, food_name, grams, calories, protein, carbs, fat, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      log.client_id,
      log.meal_type,
      log.food_id || null,
      log.food_name,
      log.grams,
      log.calories,
      log.protein,
      log.carbs,
      log.fat,
      loggedAt
    );
    const row = this.db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(id) as MealLog;
    return row;
  }

  public async getMealLogs(clientId: string, dateStr?: string): Promise<MealLog[]> {
    if (dateStr) {
      const rows = this.db.prepare(`
        SELECT * FROM meal_logs WHERE client_id = ? AND substr(logged_at, 1, 10) = ? ORDER BY logged_at ASC
      `).all(clientId, dateStr) as MealLog[];
      return rows;
    }
    const rows = this.db.prepare('SELECT * FROM meal_logs WHERE client_id = ? ORDER BY logged_at DESC LIMIT 100').all(clientId) as MealLog[];
    return rows;
  }

  public async logWeight(log: {
    client_id: string;
    weight_kg: number;
    notes?: string;
    logged_at?: string;
  }): Promise<WeightLog> {
    const id = `wtlog-${Date.now()}`;
    const loggedAt = log.logged_at || new Date().toISOString();
    this.db.prepare(`
      INSERT INTO weight_logs (id, client_id, weight_kg, notes, logged_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, log.client_id, log.weight_kg, log.notes || null, loggedAt);

    // Update current weight in client profile
    this.db.prepare('UPDATE client_profiles SET current_weight_kg = ? WHERE user_id = ?').run(log.weight_kg, log.client_id);

    const row = this.db.prepare('SELECT * FROM weight_logs WHERE id = ?').get(id) as WeightLog;
    return row;
  }

  public async getWeightLogs(clientId: string, limit = 30): Promise<WeightLog[]> {
    const rows = this.db.prepare('SELECT * FROM weight_logs WHERE client_id = ? ORDER BY logged_at DESC LIMIT ?').all(clientId, limit) as WeightLog[];
    return rows;
  }

  // CheckIns
  public async submitCheckIn(checkIn: {
    client_id: string;
    week_start_date: string;
    energy_score: number;
    sleep_hours: number;
    diet_adherence_score: number;
    workout_adherence_score: number;
    notes?: string;
  }): Promise<CheckIn> {
    const id = `cin-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO check_ins (id, client_id, week_start_date, energy_score, sleep_hours, diet_adherence_score, workout_adherence_score, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
    `).run(
      id,
      checkIn.client_id,
      checkIn.week_start_date,
      checkIn.energy_score,
      checkIn.sleep_hours,
      checkIn.diet_adherence_score,
      checkIn.workout_adherence_score,
      checkIn.notes || null
    );
    const row = this.db.prepare('SELECT * FROM check_ins WHERE id = ?').get(id) as CheckIn;
    return row;
  }

  public async getCheckIns(clientId: string): Promise<CheckIn[]> {
    const rows = this.db.prepare('SELECT * FROM check_ins WHERE client_id = ? ORDER BY submitted_at DESC').all(clientId) as CheckIn[];
    return rows;
  }

  public async updateCheckInFeedback(checkInId: string, feedback: string): Promise<void> {
    this.db.prepare(`
      UPDATE check_ins SET trainer_feedback = ?, status = 'reviewed' WHERE id = ?
    `).run(feedback, checkInId);
  }

  // Messaging & Calls
  public async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(userId1, userId2, userId2, userId1) as any[];
    return rows.map((r) => ({
      ...r,
      is_read: Boolean(r.is_read),
    })) as Message[];
  }

  public async sendMessage(msg: {
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_url?: string;
  }): Promise<Message> {
    const id = `msg-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, content, attachment_url, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, msg.sender_id, msg.receiver_id, msg.content, msg.attachment_url || null);
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
    return row;
  }

  public async createCallRequest(req: {
    client_id: string;
    trainer_id: string;
    preferred_slot: string;
    topic: string;
    channel: 'meet' | 'zoom' | 'whatsapp';
  }): Promise<CallRequest> {
    const id = `call-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO call_requests (id, client_id, trainer_id, preferred_slot, topic, channel, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, req.client_id, req.trainer_id, req.preferred_slot, req.topic, req.channel);
    const row = this.db.prepare('SELECT * FROM call_requests WHERE id = ?').get(id) as CallRequest;
    return row;
  }

  public async getCallRequests(trainerId: string): Promise<CallRequest[]> {
    const rows = this.db.prepare('SELECT * FROM call_requests WHERE trainer_id = ? ORDER BY created_at DESC').all(trainerId) as CallRequest[];
    return rows;
  }

  // Subscriptions
  public async createSubscription(sub: {
    client_id: string;
    plan_type: 'monthly' | 'quarterly';
    network: 'MTN' | 'AIRTEL';
    phone_number: string;
    amount_ugx: number;
    reference_id: string;
  }): Promise<Subscription> {
    const id = `sub-${Date.now()}`;
    const days = sub.plan_type === 'quarterly' ? 90 : 30;
    this.db.prepare(`
      INSERT INTO subscriptions (id, client_id, plan_type, network, phone_number, amount_ugx, status, reference_id, starts_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now', '+${days} days'))
    `).run(id, sub.client_id, sub.plan_type, sub.network, sub.phone_number, sub.amount_ugx, sub.reference_id);
    const row = this.db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as Subscription;
    return row;
  }

  public async getSubscription(clientId: string): Promise<Subscription | null> {
    const row = this.db.prepare('SELECT * FROM subscriptions WHERE client_id = ? ORDER BY expires_at DESC LIMIT 1').get(clientId) as Subscription | undefined;
    return row || null;
  }

  // Vision
  public async savePoseSession(session: {
    client_id: string;
    exercise: 'squat' | 'push_up' | 'plank';
    reps_completed: number;
    duration_seconds: number;
    avg_form_score: number;
    rep_durations_json?: string;
    angles_log_json?: string;
  }): Promise<PoseSession> {
    const id = `pose-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO pose_sessions (id, client_id, exercise, reps_completed, duration_seconds, avg_form_score, rep_durations_json, angles_log_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      session.client_id,
      session.exercise,
      session.reps_completed,
      session.duration_seconds,
      session.avg_form_score,
      session.rep_durations_json || null,
      session.angles_log_json || null
    );
    const row = this.db.prepare('SELECT * FROM pose_sessions WHERE id = ?').get(id) as PoseSession;
    return row;
  }

  public async getPoseSessions(clientId: string): Promise<PoseSession[]> {
    const rows = this.db.prepare('SELECT * FROM pose_sessions WHERE client_id = ? ORDER BY created_at DESC LIMIT 20').all(clientId) as PoseSession[];
    return rows;
  }

  // Form Checks
  public async saveFormCheck(formCheck: {
    client_id: string;
    exercise: string;
    video_path: string;
    thumbnail_path?: string;
    ai_score: number;
    ai_good_json: string;
    ai_fixes_json: string;
    ai_safety_note: string;
    ai_cue: string;
  }): Promise<FormCheck> {
    const id = `fc-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO form_checks (id, client_id, exercise, video_path, thumbnail_path, ai_score, ai_good_json, ai_fixes_json, ai_safety_note, ai_cue)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      formCheck.client_id,
      formCheck.exercise,
      formCheck.video_path,
      formCheck.thumbnail_path || null,
      formCheck.ai_score,
      formCheck.ai_good_json,
      formCheck.ai_fixes_json,
      formCheck.ai_safety_note,
      formCheck.ai_cue
    );
    const row = this.db.prepare('SELECT * FROM form_checks WHERE id = ?').get(id) as FormCheck;
    return row;
  }

  public async getFormChecks(clientId: string): Promise<FormCheck[]> {
    const rows = this.db.prepare('SELECT * FROM form_checks WHERE client_id = ? ORDER BY created_at DESC').all(clientId) as FormCheck[];
    return rows;
  }

  public async getAllFormChecksForTrainer(trainerId: string): Promise<FormCheck[]> {
    const rows = this.db.prepare(`
      SELECT fc.* FROM form_checks fc
      JOIN client_profiles cp ON fc.client_id = cp.user_id
      WHERE cp.trainer_id = ?
      ORDER BY fc.created_at DESC
    `).all(trainerId) as FormCheck[];
    return rows;
  }

  public async updateFormCheckComment(id: string, comment: string): Promise<void> {
    this.db.prepare(`
      UPDATE form_checks SET trainer_comment = ?, trainer_commented_at = datetime('now') WHERE id = ?
    `).run(comment, id);
  }
}
