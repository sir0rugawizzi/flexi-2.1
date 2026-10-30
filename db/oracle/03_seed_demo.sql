-- ============================================================================
-- FlexiFit: Oracle 23c / APEX Deliverable
-- Script: 03_seed_demo.sql
-- Run in APEX SQL Workshop > SQL Scripts
-- ============================================================================

-- Clean demo records if re-running
DELETE FROM form_checks WHERE client_id LIKE 'client-%';
DELETE FROM subscriptions WHERE client_id LIKE 'client-%';
DELETE FROM messages WHERE sender_id LIKE 'client-%' OR receiver_id LIKE 'client-%';
DELETE FROM check_ins WHERE client_id LIKE 'client-%';
DELETE FROM weight_logs WHERE client_id LIKE 'client-%';
DELETE FROM meal_logs WHERE client_id LIKE 'client-%';
DELETE FROM workout_logs WHERE client_id LIKE 'client-%';
DELETE FROM plan_assignments WHERE client_id LIKE 'client-%';
DELETE FROM meal_plans WHERE id = 'plan-meal-balanced';
DELETE FROM workout_plans WHERE id = 'plan-workout-fullbody';
DELETE FROM client_profiles WHERE user_id LIKE 'client-%';
DELETE FROM trainer_profiles WHERE user_id = 'trainer-brian-01';
DELETE FROM users WHERE id IN ('trainer-brian-01', 'client-ronald-01', 'client-sarah-02', 'client-david-03', 'client-grace-04', 'client-ivan-05', 'client-flavia-06');

-- 1. Coach Brian Mukasa (Trainer)
INSERT INTO users (id, email, password_hash, role, name, phone, avatar_url, created_at)
VALUES (
    'trainer-brian-01',
    'brian@flexifit.ug',
    '$2a$10$w3U/9q5uN9e/JcKzQ7W61eqsOQf.wM8Yn6J0Vl.sH5vK/7uN1q2zC', -- password123
    'trainer',
    'Coach Brian Mukasa',
    '+256701234567',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    CURRENT_TIMESTAMP - INTERVAL '60' DAY
);

INSERT INTO trainer_profiles (user_id, bio, specialties, meet_link, zoom_link, whatsapp_number, preferred_channel, monthly_rate_ugx, in_person_rate_ugx)
VALUES (
    'trainer-brian-01',
    'Certified Strength & Conditioning Specialist with 8+ years coaching Kampala urban professionals in sustainable home training and indigenous nutrition.',
    'Hypertrophy, Functional Movement, Weight Loss, Posture',
    'https://meet.google.com/new',
    'https://zoom.us/j/flexifituganda',
    '256701234567',
    'meet',
    90000,
    300000
);

-- 2. Master Plans
INSERT INTO workout_plans (id, trainer_id, title, description, goal_tag, days_per_week, schedule_json)
VALUES (
    'plan-workout-fullbody',
    'trainer-brian-01',
    'Kampala Home Strength & Tone',
    '3-day progressive overload program targeting posture, core rigidity, and functional strength for busy professionals.',
    'General Fitness',
    3,
    '[{"day_number":1,"day_name":"Monday: Lower Body Power","exercises":[{"exercise_name":"Bodyweight Squats","sets":4,"reps":15,"rest_seconds":60}]}]'
);

INSERT INTO meal_plans (id, trainer_id, title, description, days_json, target_calories, target_protein, target_carbs, target_fat)
VALUES (
    'plan-meal-balanced',
    'trainer-brian-01',
    'High-Protein Indigenous Vitality Plan',
    'Whole-food Ugandan nutrition plan combining Matooke with lean Lake Victoria Tilapia and greens.',
    '[{"day_number":1,"day_name":"Everyday Balanced Plan","meals":[{"meal_type":"lunch","food_name":"Steamed Matooke with Yellow Beans","serving_grams":350,"calories":431,"protein":14.9,"carbs":91.4,"fat":1.7}]}]',
    2050,
    135.0,
    220.0,
    60.0
);

-- 3. Clients
-- Kato Ronald (Flagged: Missed workouts)
INSERT INTO users (id, email, password_hash, role, name, phone, created_at)
VALUES ('client-ronald-01', 'ronald@flexifit.ug', '$2a$10$w3U/9q5uN9e/JcKzQ7W61eqsOQf.wM8Yn6J0Vl.sH5vK/7uN1q2zC', 'client', 'Kato Ronald', '+256772111222', CURRENT_TIMESTAMP - INTERVAL '35' DAY);

INSERT INTO client_profiles (user_id, trainer_id, fitness_goal, target_weight_kg, current_weight_kg, target_calories, target_protein_g, target_carbs_g, target_fat_g, streak_days)
VALUES ('client-ronald-01', 'trainer-brian-01', 'muscle_gain', 78.0, 74.5, 2400, 150.0, 300.0, 66.0, 0);

INSERT INTO plan_assignments (id, client_id, workout_plan_id, meal_plan_id, assigned_by)
VALUES ('assign-ronald-01', 'client-ronald-01', 'plan-workout-fullbody', 'plan-meal-balanced', 'trainer-brian-01');

-- Workout logged 4 days ago (triggers 3-day inactivity flag!)
INSERT INTO workout_logs (id, client_id, exercise_name, sets_completed, reps_completed, weight_kg, duration_minutes, logged_at)
VALUES ('wlog-ronald-1', 'client-ronald-01', 'Bodyweight Squats', 3, 15, 0, 30, CURRENT_TIMESTAMP - INTERVAL '4' DAY);

-- Namubiru Sarah (Flagged: Macro deficit)
INSERT INTO users (id, email, password_hash, role, name, phone, created_at)
VALUES ('client-sarah-02', 'sarah@flexifit.ug', '$2a$10$w3U/9q5uN9e/JcKzQ7W61eqsOQf.wM8Yn6J0Vl.sH5vK/7uN1q2zC', 'client', 'Namubiru Sarah', '+256782333444', CURRENT_TIMESTAMP - INTERVAL '35' DAY);

INSERT INTO client_profiles (user_id, trainer_id, fitness_goal, target_weight_kg, current_weight_kg, target_calories, target_protein_g, target_carbs_g, target_fat_g, streak_days)
VALUES ('client-sarah-02', 'trainer-brian-01', 'weight_loss', 65.0, 73.2, 1700, 120.0, 180.0, 45.0, 3);

INSERT INTO plan_assignments (id, client_id, workout_plan_id, meal_plan_id, assigned_by)
VALUES ('assign-sarah-02', 'client-sarah-02', 'plan-workout-fullbody', 'plan-meal-balanced', 'trainer-brian-01');

INSERT INTO workout_logs (id, client_id, exercise_name, sets_completed, reps_completed, weight_kg, duration_minutes, logged_at)
VALUES ('wlog-sarah-1', 'client-sarah-02', 'Push-Ups (Standard / Incline)', 3, 10, 0, 25, CURRENT_TIMESTAMP - INTERVAL '1' DAY);

-- Under-eating: only 800 kcal recorded per day (<70% of 1700 kcal target)
INSERT INTO meal_logs (id, client_id, meal_type, food_name, grams, calories, protein, carbs, fat, logged_at)
VALUES ('mlog-sarah-1', 'client-sarah-02', 'lunch', 'Steamed Cabbage', 200, 76, 2.8, 14.4, 1.0, CURRENT_TIMESTAMP - INTERVAL '1' DAY);

-- Mugisha Ivan (On track: fully compliant)
INSERT INTO users (id, email, password_hash, role, name, phone, created_at)
VALUES ('client-ivan-05', 'ivan@flexifit.ug', '$2a$10$w3U/9q5uN9e/JcKzQ7W61eqsOQf.wM8Yn6J0Vl.sH5vK/7uN1q2zC', 'client', 'Mugisha Ivan', '+256782999000', CURRENT_TIMESTAMP - INTERVAL '35' DAY);

INSERT INTO client_profiles (user_id, trainer_id, fitness_goal, target_weight_kg, current_weight_kg, target_calories, target_protein_g, target_carbs_g, target_fat_g, streak_days)
VALUES ('client-ivan-05', 'trainer-brian-01', 'muscle_gain', 80.0, 79.2, 2500, 160.0, 310.0, 70.0, 14);

INSERT INTO plan_assignments (id, client_id, workout_plan_id, meal_plan_id, assigned_by)
VALUES ('assign-ivan-05', 'client-ivan-05', 'plan-workout-fullbody', 'plan-meal-balanced', 'trainer-brian-01');

INSERT INTO workout_logs (id, client_id, exercise_name, sets_completed, reps_completed, weight_kg, duration_minutes, logged_at)
VALUES ('wlog-ivan-1', 'client-ivan-05', 'Bodyweight Squats', 4, 20, 0, 45, CURRENT_TIMESTAMP - INTERVAL '1' DAY);

INSERT INTO weight_logs (id, client_id, weight_kg, notes, logged_at)
VALUES ('wtlog-ivan-1', 'client-ivan-05', 79.2, 'Steady progression', CURRENT_TIMESTAMP - INTERVAL '2' DAY);

INSERT INTO check_ins (id, client_id, week_start_date, energy_score, sleep_hours, diet_adherence_score, workout_adherence_score, notes, status, submitted_at)
VALUES ('cin-ivan-1', 'client-ivan-05', 'Week 4', 9, 8.0, 9, 10, 'Great energy levels!', 'reviewed', CURRENT_TIMESTAMP - INTERVAL '2' DAY);

COMMIT;
/
