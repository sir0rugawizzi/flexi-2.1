-- ============================================================================
-- FlexiFit: Oracle 23c / APEX Database Schema
-- Script: 01_schema.sql
-- Run in APEX SQL Workshop > SQL Scripts
-- ============================================================================

-- Clean up existing tables and view if rebuilding
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW v_client_flags';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

BEGIN
  FOR t IN (
    SELECT table_name FROM user_tables WHERE table_name IN (
      'FORM_CHECKS', 'POSE_SESSIONS', 'SUBSCRIPTIONS', 'CALL_REQUESTS',
      'MESSAGES', 'CHECK_INS', 'WEIGHT_LOGS', 'MEAL_LOGS', 'WORKOUT_LOGS',
      'PLAN_ASSIGNMENTS', 'MEAL_PLANS', 'WORKOUT_PLANS', 'EXERCISES',
      'FOODS', 'CLIENT_PROFILES', 'TRAINER_PROFILES', 'USERS'
    )
  ) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

-- 1. USERS
CREATE TABLE users (
    id            VARCHAR2(64) PRIMARY KEY,
    email         VARCHAR2(255) NOT NULL UNIQUE,
    password_hash VARCHAR2(255) NOT NULL,
    role          VARCHAR2(20) NOT NULL CHECK (role IN ('trainer', 'client', 'admin')),
    name          VARCHAR2(255) NOT NULL,
    phone         VARCHAR2(50) NOT NULL,
    avatar_url    VARCHAR2(1000),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TRAINER_PROFILES
CREATE TABLE trainer_profiles (
    user_id            VARCHAR2(64) PRIMARY KEY,
    bio                VARCHAR2(4000),
    specialties        VARCHAR2(1000),
    meet_link          VARCHAR2(1000),
    zoom_link          VARCHAR2(1000),
    whatsapp_number    VARCHAR2(50),
    preferred_channel  VARCHAR2(20) DEFAULT 'meet' CHECK (preferred_channel IN ('meet', 'zoom', 'whatsapp')),
    monthly_rate_ugx   NUMBER(12,0) DEFAULT 90000,
    in_person_rate_ugx NUMBER(12,0) DEFAULT 300000,
    CONSTRAINT fk_trainer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. CLIENT_PROFILES
CREATE TABLE client_profiles (
    user_id           VARCHAR2(64) PRIMARY KEY,
    trainer_id        VARCHAR2(64),
    gender            VARCHAR2(20),
    dob               DATE,
    height_cm         NUMBER(5,1),
    target_weight_kg  NUMBER(5,1),
    current_weight_kg NUMBER(5,1),
    activity_level    VARCHAR2(50),
    fitness_goal      VARCHAR2(50) DEFAULT 'fitness',
    target_calories   NUMBER(6,0) DEFAULT 2000,
    target_protein_g  NUMBER(6,1) DEFAULT 130,
    target_carbs_g    NUMBER(6,1) DEFAULT 220,
    target_fat_g      NUMBER(6,1) DEFAULT 65,
    streak_days       NUMBER(6,0) DEFAULT 0,
    CONSTRAINT fk_client_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. FOODS
CREATE TABLE foods (
    id                VARCHAR2(64) PRIMARY KEY,
    name              VARCHAR2(255) NOT NULL,
    local_name        VARCHAR2(255),
    category          VARCHAR2(50) NOT NULL,
    calories_100g     NUMBER(7,1) NOT NULL,
    protein_100g      NUMBER(6,1) NOT NULL,
    carbs_100g        NUMBER(6,1) NOT NULL,
    fat_100g          NUMBER(6,1) NOT NULL,
    fiber_100g        NUMBER(6,1) DEFAULT 0,
    typical_serving_g NUMBER(6,1) NOT NULL,
    serving_unit      VARCHAR2(100) NOT NULL,
    source            VARCHAR2(255) NOT NULL,
    is_verified       NUMBER(1,0) DEFAULT 1 CHECK (is_verified IN (0, 1)),
    is_custom         NUMBER(1,0) DEFAULT 0 CHECK (is_custom IN (0, 1))
);

-- 5. EXERCISES
CREATE TABLE exercises (
    id                VARCHAR2(64) PRIMARY KEY,
    name              VARCHAR2(255) NOT NULL,
    target_muscle     VARCHAR2(255) NOT NULL,
    secondary_muscles VARCHAR2(500),
    equipment         VARCHAR2(50) DEFAULT 'none',
    difficulty        VARCHAR2(50) DEFAULT 'beginner',
    instructions      CLOB NOT NULL,
    video_url         VARCHAR2(1000),
    is_bodyweight     NUMBER(1,0) DEFAULT 1 CHECK (is_bodyweight IN (0, 1))
);

-- 6. WORKOUT_PLANS
CREATE TABLE workout_plans (
    id            VARCHAR2(64) PRIMARY KEY,
    trainer_id    VARCHAR2(64) NOT NULL,
    title         VARCHAR2(255) NOT NULL,
    description   VARCHAR2(4000) NOT NULL,
    goal_tag      VARCHAR2(100) NOT NULL,
    days_per_week NUMBER(2,0) DEFAULT 3,
    schedule_json CLOB NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wp_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. MEAL_PLANS
CREATE TABLE meal_plans (
    id              VARCHAR2(64) PRIMARY KEY,
    trainer_id      VARCHAR2(64) NOT NULL,
    title           VARCHAR2(255) NOT NULL,
    description     VARCHAR2(4000) NOT NULL,
    days_json       CLOB NOT NULL,
    target_calories NUMBER(6,0) NOT NULL,
    target_protein  NUMBER(6,1) NOT NULL,
    target_carbs    NUMBER(6,1) NOT NULL,
    target_fat      NUMBER(6,1) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mp_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. PLAN_ASSIGNMENTS
CREATE TABLE plan_assignments (
    id              VARCHAR2(64) PRIMARY KEY,
    client_id       VARCHAR2(64) NOT NULL,
    workout_plan_id VARCHAR2(64),
    meal_plan_id    VARCHAR2(64),
    assigned_by     VARCHAR2(64) NOT NULL,
    assigned_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active       NUMBER(1,0) DEFAULT 1 CHECK (is_active IN (0, 1)),
    CONSTRAINT fk_pa_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_wp FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL,
    CONSTRAINT fk_pa_mp FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE SET NULL
);

-- 9. WORKOUT_LOGS
CREATE TABLE workout_logs (
    id               VARCHAR2(64) PRIMARY KEY,
    client_id        VARCHAR2(64) NOT NULL,
    plan_id          VARCHAR2(64),
    exercise_id      VARCHAR2(64),
    exercise_name    VARCHAR2(255) NOT NULL,
    sets_completed   NUMBER(4,0) NOT NULL,
    reps_completed   NUMBER(4,0) NOT NULL,
    weight_kg        NUMBER(5,1) DEFAULT 0,
    duration_minutes NUMBER(4,0) DEFAULT 30,
    rpe_score        NUMBER(2,0),
    notes            VARCHAR2(2000),
    logged_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wlog_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. MEAL_LOGS
CREATE TABLE meal_logs (
    id         VARCHAR2(64) PRIMARY KEY,
    client_id  VARCHAR2(64) NOT NULL,
    meal_type  VARCHAR2(50) NOT NULL,
    food_id    VARCHAR2(64),
    food_name  VARCHAR2(255) NOT NULL,
    grams      NUMBER(6,1) NOT NULL,
    calories   NUMBER(6,1) NOT NULL,
    protein    NUMBER(6,1) NOT NULL,
    carbs      NUMBER(6,1) NOT NULL,
    fat        NUMBER(6,1) NOT NULL,
    logged_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mlog_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. WEIGHT_LOGS
CREATE TABLE weight_logs (
    id        VARCHAR2(64) PRIMARY KEY,
    client_id VARCHAR2(64) NOT NULL,
    weight_kg NUMBER(5,1) NOT NULL,
    notes     VARCHAR2(1000),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wtlog_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. CHECK_INS
CREATE TABLE check_ins (
    id                      VARCHAR2(64) PRIMARY KEY,
    client_id               VARCHAR2(64) NOT NULL,
    week_start_date         VARCHAR2(50) NOT NULL,
    energy_score            NUMBER(2,0) NOT NULL,
    sleep_hours             NUMBER(3,1) NOT NULL,
    diet_adherence_score    NUMBER(2,0) NOT NULL,
    workout_adherence_score NUMBER(2,0) NOT NULL,
    notes                   VARCHAR2(4000),
    trainer_feedback        VARCHAR2(4000),
    status                  VARCHAR2(50) DEFAULT 'submitted',
    submitted_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cin_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. MESSAGES
CREATE TABLE messages (
    id             VARCHAR2(64) PRIMARY KEY,
    sender_id      VARCHAR2(64) NOT NULL,
    receiver_id    VARCHAR2(64) NOT NULL,
    content        VARCHAR2(4000) NOT NULL,
    attachment_url VARCHAR2(1000),
    is_read        NUMBER(1,0) DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. CALL_REQUESTS
CREATE TABLE call_requests (
    id             VARCHAR2(64) PRIMARY KEY,
    client_id      VARCHAR2(64) NOT NULL,
    trainer_id     VARCHAR2(64) NOT NULL,
    preferred_slot VARCHAR2(100) NOT NULL,
    topic          VARCHAR2(500) NOT NULL,
    channel        VARCHAR2(20) DEFAULT 'meet',
    status         VARCHAR2(20) DEFAULT 'pending',
    meeting_url    VARCHAR2(1000),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cr_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id           VARCHAR2(64) PRIMARY KEY,
    client_id    VARCHAR2(64) NOT NULL,
    plan_type    VARCHAR2(50) NOT NULL,
    network      VARCHAR2(20) NOT NULL,
    phone_number VARCHAR2(50) NOT NULL,
    amount_ugx   NUMBER(12,0) NOT NULL,
    status       VARCHAR2(20) DEFAULT 'active',
    reference_id VARCHAR2(100) NOT NULL,
    starts_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_sub_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. POSE_SESSIONS
CREATE TABLE pose_sessions (
    id                 VARCHAR2(64) PRIMARY KEY,
    client_id          VARCHAR2(64) NOT NULL,
    exercise           VARCHAR2(50) NOT NULL,
    reps_completed     NUMBER(5,0) NOT NULL,
    duration_seconds   NUMBER(6,0) NOT NULL,
    avg_form_score     NUMBER(4,1) NOT NULL,
    rep_durations_json CLOB,
    angles_log_json    CLOB,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pose_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. FORM_CHECKS
CREATE TABLE form_checks (
    id                   VARCHAR2(64) PRIMARY KEY,
    client_id            VARCHAR2(64) NOT NULL,
    exercise             VARCHAR2(255) NOT NULL,
    video_path           VARCHAR2(1000) NOT NULL,
    thumbnail_path       VARCHAR2(1000),
    ai_score             NUMBER(2,0) NOT NULL,
    ai_good_json         CLOB NOT NULL,
    ai_fixes_json        CLOB NOT NULL,
    ai_safety_note       VARCHAR2(2000) NOT NULL,
    ai_cue               VARCHAR2(1000) NOT NULL,
    trainer_comment      VARCHAR2(4000),
    trainer_commented_at TIMESTAMP WITH TIME ZONE,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fc_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for high-throughput querying
CREATE INDEX idx_wlog_cdate ON workout_logs(client_id, logged_at);
CREATE INDEX idx_mlog_cdate ON meal_logs(client_id, logged_at);
CREATE INDEX idx_wtlog_cdate ON weight_logs(client_id, logged_at);
CREATE INDEX idx_cin_cdate ON check_ins(client_id, submitted_at);

-- 18. ASYNCHRONOUS COMPLIANCE FLAGS VIEW (v_client_flags)
CREATE OR REPLACE VIEW v_client_flags AS
SELECT
    cp.user_id AS client_id,
    cp.trainer_id,
    u.name AS client_name,
    u.email AS client_email,
    -- Check 1: Inactivity (No workout in last 3 days)
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM workout_logs wl
            WHERE wl.client_id = cp.user_id
              AND wl.logged_at >= CURRENT_TIMESTAMP - INTERVAL '3' DAY
        ) THEN 1 ELSE 0
    END AS flag_missed_workouts,
    -- Check 2: Nutrition Deficit (7-day macro adherence < 70%)
    CASE
        WHEN NVL((
            SELECT AVG(LEAST(100, GREATEST(0, (daily_cals / NULLIF(cp.target_calories, 0)) * 100)))
            FROM (
                SELECT TRUNC(CAST(ml.logged_at AS DATE)) AS log_day, SUM(ml.calories) AS daily_cals
                FROM meal_logs ml
                WHERE ml.client_id = cp.user_id
                  AND ml.logged_at >= CURRENT_TIMESTAMP - INTERVAL '7' DAY
                GROUP BY TRUNC(CAST(ml.logged_at AS DATE))
            )
        ), 0) < 70 THEN 1 ELSE 0
    END AS flag_nutrition_deficit,
    -- Check 3: Stale Weight (No weight logged in last 7 days)
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM weight_logs wtl
            WHERE wtl.client_id = cp.user_id
              AND wtl.logged_at >= CURRENT_TIMESTAMP - INTERVAL '7' DAY
        ) THEN 1 ELSE 0
    END AS flag_stale_weight,
    -- Check 4: Overdue Check-In (No check-in in last 7 days)
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM check_ins ci
            WHERE ci.client_id = cp.user_id
              AND ci.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '7' DAY
        ) THEN 1 ELSE 0
    END AS flag_overdue_checkin
FROM client_profiles cp
JOIN users u ON cp.user_id = u.id;
/
